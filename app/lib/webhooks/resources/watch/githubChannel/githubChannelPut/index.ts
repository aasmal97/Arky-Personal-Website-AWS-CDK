import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getRepositories } from "../../../../../../../utils/github/getUserRepos";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
import axios, { AxiosError } from "axios";
import ignoreRepoMap from "../../../github/githubPost/ignoreRepoList";
import { getDocuments } from "../../../../../../../utils/crudRestApiMethods/getMethod";
import { putDocument } from "../../../../../../../utils/crudRestApiMethods/putMethod";
import { Repository } from "@octokit/webhooks-types";
type GithubChannelProps = {
  isInOrganization: boolean;
  repoName: string;
  repoOwner: string;
  githubToken: string;
  isPrivate: boolean;
  repoData?: Partial<Repository>;
};

const checkChannelExists = async ({
  repoName,
  repoOwner,
  githubToken,
}: GithubChannelProps) => {
  const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  let result: boolean;
  const reqUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`;
  try {
    const { data } = await axios({
      method: "get",
      url: reqUrl,
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    });
    const findHookCreatedByApp = data.filter(
      (hook: any) =>
        hook.config.url === `https://${domainName}/github` && hook.active
    );
    result = findHookCreatedByApp.length > 0;
  } catch (err) {
    //this means that we simply don't have access to this repo to attach
    //webhooks. That means we cannot watch it, and we return that a hook exists
    //to not subscribe to a new one
    result = true;
  }
  return result;
};
const checkIfProjectDocExists = async ({
  restApiUrl,
  apiKey,
  projectName,
}: {
  restApiUrl: string;
  apiKey: string;
  projectName: string;
}) => {
  const docs = await getDocuments({
    restApiUrl,
    apiKey,
    params: {
      query: JSON.stringify({
        recordType: "projects",
        projectName,
      }),
      max: 1,
    },
    addedRoute: "projects",
  });
  const result = docs.data?.result?.Items;
  return result && result.length > 0;
};
const createChannel = async ({
  repoName,
  repoOwner,
  githubToken,
  isInOrganization,
  isPrivate,
  repoData,
}: GithubChannelProps) => {
  const restApiUrl = convertToStr(process.env.AMAZON_REST_API_DOMAIN_NAME);
  const apiKey = convertToStr(process.env.AMAZON_REST_API_KEY);
  const repoWebhookExistsPromise = checkChannelExists({
    repoName,
    repoOwner,
    githubToken,
    isInOrganization,
    isPrivate,
  });
  const projectDocExistsPromise = checkIfProjectDocExists({
    restApiUrl,
    apiKey,
    projectName: repoName,
  });
  const [repoWebhookExists, projectDocExists] = await Promise.all([
    repoWebhookExistsPromise,
    projectDocExistsPromise,
  ]);
  if (!repoData) return "No repo data provided";
  const { name, html_url, description, topics, homepage, created_at } =
    repoData;
  if (!projectDocExists)
    await putDocument({
      restApiUrl,
      apiKey,
      data: {
        recordType: "projects",
        projectName: name,
        githubURL: html_url,
        description: description,
        startDate: created_at ? new Date(created_at).toISOString() : undefined,
        topics: topics,
        appURL: homepage,
      },
      addedRoute: "projects",
    });
  if (repoWebhookExists) return "Channel already exists";
  const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  const webhooksTokenSecret = convertToStr(
    process.env.WEBHOOKS_API_TOKEN_SECRET
  );
  const reqUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`;
  try {
    const { data } = await axios({
      method: "post",
      url: reqUrl,
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      data: {
        name: "web",
        active: true,
        events: ["repository"],
        config: {
          url: `https://${domainName}/github`,
          secret: webhooksTokenSecret,
          content_type: "json",
        },
      },
    });
    return data;
  } catch (err) {
    const e = err as AxiosError;
    return `Error setting up webhook for ${reqUrl}`;
  }
};
const createWatchChannels = async () => {
  const githubToken = convertToStr(process.env.GIT_HUB_PERSONAL_ACCESS_TOKEN);
  const {
    data: {
      user: {
        repositories: { nodes: repositories },
      },
    },
  } = await getRepositories(githubToken);
  const repoNames: (Omit<GithubChannelProps, "githubToken"> | null)[] =
    repositories.map((repo: any) => {
      if (repo.name in ignoreRepoMap) return null;
      const nodes = repo.repositoryTopics.nodes;
      const topicNames = nodes.map((n: any) => n.topic.name);
      return {
        repoName: repo.name,
        repoOwner: repo.owner.login,
        isInOrganization: repo.isInOrganization,
        isPrivate: repo.isPrivate,
        repoData: {
          name: repo.name,
          html_url: repo.url,
          description: repo.description,
          created_at: repo.createdAt,
          homepage: repo.homepageUrl,
          topics: topicNames,
        },
      };
    });
  const promiseArr = repoNames.map((repo) => {
    if (!repo) return null;
    return createChannel({
      ...repo,
      githubToken: githubToken,
    });
  });
  const results = await Promise.all(
    promiseArr.map((p) => {
      if (!p) return null;
      return p.catch((err) => {
        console.error(err);
        return null;
      });
    })
  );
  return JSON.stringify(results, null, 4);
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "PUT")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  try {
    const watchRes = await createWatchChannels();
    return {
      statusCode: 200,
      body: JSON.stringify(watchRes),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
}
