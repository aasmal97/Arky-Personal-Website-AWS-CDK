import axios from "axios";
import { convert } from "html-to-text";
import { sub } from "date-fns";
import { getRepoCount, callGithubGraphQL } from "@utils/github/getUserRepos";
import { corsHeaders } from "@app/types";
import {
  AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME,
  METRICS_DB_DEFAULT_PK_KEY,
  METRICS_DB_DEFAULT_SORT_KEY,
} from "@lib/constants";
import {
  AttributeValue,
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  GithubData,
  METRIC_TYPE,
  StackOverflowData,
  UserMetricDocument,
} from "@app/types/userMetrics.types";
type ContributionsObj = {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
};
const tableName = process.env[AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME];
const client = new DynamoDBClient({
  region: "us-east-1",
});
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
export const constructUpdateExpression = (
  obj: Record<string, AttributeValue>
) => {
  // Construct the Update Expression
  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: AttributeValue } = {};

  for (const [field, value] of Object.entries(obj)) {
    const attributeName = `#${field}`;
    const attributeValue = `:${field}`;

    updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
    expressionAttributeNames[attributeName] = field;
    expressionAttributeValues[attributeValue] = value; // Adjust the type as needed (S, N, BOOL, etc.)
  }
  return {
    UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };
};
export const handler = async () => {
  const promiseArr: [
    Promise<StackOverflowData | null>,
    Promise<GithubData | null>
  ] = [getStackOverflowInfo(), getGithubUserData()];
  //grab data
  const [stackOverflowData, githubData] = await Promise.all(promiseArr);
  //ensure data is not null, else don't update
  const dateModified = new Date().toISOString();
  const newMetrics: Partial<UserMetricDocument> = {};
  if (stackOverflowData) {
    newMetrics.stackOverflowData = stackOverflowData;
  }
  if (githubData) {
    newMetrics.githubData = githubData;
  }
  //update dynamodb database
  const parsedMetrics = marshall(newMetrics);

  const command = new UpdateItemCommand({
    TableName: tableName,
    Key: marshall({
      [METRICS_DB_DEFAULT_PK_KEY]: METRIC_TYPE.PERSONAL,
      [METRICS_DB_DEFAULT_SORT_KEY]: dateModified,
    }),
    ...constructUpdateExpression(parsedMetrics),
  });
  const res = await client.send(command);
  if (res.$metadata.httpStatusCode !== 200)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: "Could not update user metrics",
    };
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(newMetrics),
  };
};
