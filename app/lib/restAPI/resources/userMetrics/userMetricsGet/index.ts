import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
import { convert } from "html-to-text";
import { sub } from "date-fns";
import * as dotenv from "dotenv";
import {
  getRepoCount,
  callGithubGraphQL,
} from "../../../../../../utils/github/getUserRepos";
import { corsHeaders } from "../../utils/corsLambda";
dotenv.config();
type ContributionsObj = {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
};

export const isContributionsObj = (e: any): e is ContributionsObj => {
  try {
    return typeof e.totalCommitContributions === "number";
  } catch (err) {
    return false;
  }
};
export const getContributions = async (token?: string) => {
  const currDate = new Date();
  const startDate = sub(currDate, {
    years: 1,
  });
  const username = "aasmal97";
  const query = `
    query ContributionsView($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
          }
        }
      }
    `;
  const variables = {
    username: username,
    from: startDate.toISOString(),
    to: currDate.toISOString(),
  };
  const data = await callGithubGraphQL({
    token,
    query,
    variables,
  });

  const contributionsColl = data.data.user.contributionsCollection;
  if (!isContributionsObj(contributionsColl)) return 0;
  const contributionEntries = Object.entries(contributionsColl);
  const sum = contributionEntries.reduce((a, b) => {
    if (typeof b[1] === "number") return a + b[1];
    else return a;
  }, 0);
  return sum;
};
export const getGithubUserData = async () => {
  const token = process.env.GIT_HUB_PERSONAL_ACCESS_TOKEN;
  const [contributions, repositories] = await Promise.all([
    getContributions(token),
    getRepoCount(token),
  ]);
  return {
    repositories: repositories,
    contributions: contributions,
  };
};
export const getStackOverflowInfo = async () => {
  const base = "https://api.stackexchange.com/";
  const userId = "16451347";
  const pathUrl = `2.3/users/${userId}?site=stackoverflow`;
  const repEndpoint = `${base}${pathUrl}`;
  const reachedEndpoint = "https://stackoverflow.com/users/16451347/arky-asmal";
  const getReputation = async () => {
    const { data } = await axios({
      method: "get",
      url: repEndpoint,
    });
    const rep = data.items[0].reputation;
    return rep;
  };
  const getImpact = async () => {
    const { data: profilePg } = await axios({
      method: "get",
      url: reachedEndpoint,
    });
    //removes all whitespace
    const userProfileRoot = convert(profilePg)
      .replace(/ /g, "")
      .replace(/\n/g, "");
    const firstKeyWord = "reputation";
    const lastKeyWord = "reached";
    const regex = new RegExp(`(?=${firstKeyWord}).*(?<=${lastKeyWord})`, "g");
    const peopleReached = userProfileRoot.match(regex);
    return peopleReached
      ? peopleReached[0].replace(firstKeyWord, "").replace(lastKeyWord, "")
      : peopleReached;
  };
  try {
    const promiseArr = [getReputation(), getImpact()];
    const [rep, peopleReached] = await Promise.all(promiseArr);
    return {
      reputation: rep,
      peopleReached: peopleReached,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};
export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod !== "GET")
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "Wrong HTTP Method",
    };
  const promiseArr = [getStackOverflowInfo(), getGithubUserData()];
  const [stackOverflowData, githubData] = await Promise.all(promiseArr);
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ stackOverflowData, githubData }),
  };
}
