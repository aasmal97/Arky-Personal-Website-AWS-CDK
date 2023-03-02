import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getRepositories } from "../../../../../../../utils/github/getUserRepos";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
import axios from "axios";
type GithubChannelProps = {
  isInOrganization: boolean;
  repoName: string;
  repoOwner: string;
  githubToken: string;
  isPrivate: boolean;
};
const checkChannelExists = async ({
  isInOrganization,
  repoName,
  repoOwner,
  githubToken,
  isPrivate,
}: GithubChannelProps) => {
  const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  let result: boolean;
  //if (isInOrganization ) return console.log(reqUrl);
  const reqUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`;
  try {
    const { data } = await axios({
      method: "get",
      url: reqUrl,
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });
    const findHookCreatedByApp = data.filter(
      (hook: any) =>
        hook.config.url === `https//${domainName}/github` && hook.active
    );
    result = findHookCreatedByApp.length > 0;
    console.log(reqUrl)
  } catch (err) {
    console.log(reqUrl, "Error");
    result = false;
  }
  return result;
};
const createChannel = async ({
  repoName,
  repoOwner,
  githubToken,
  isInOrganization,
  isPrivate,
}: GithubChannelProps) => {
  const checkIfExists = await checkChannelExists({
    repoName,
    repoOwner,
    githubToken,
    isInOrganization,
    isPrivate,
  });
  if (checkIfExists) return "Channel already exists";
  return;
  // const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  // const webhooksTokenSecret = convertToStr(
  //   process.env.WEBHOOKS_API_TOKEN_SECRET
  // );
  // const reqUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
  // const { data } = await axios({
  //   method: "post",
  //   url: reqUrl,
  //   headers: {
  //     Authorization: `token ${githubToken}`,
  //   },
  //   data: {
  //     name: "web",
  //     active: true,
  //     events: ["repository"],
  //     config: {
  //       url: `https//${domainName}/github`,
  //       secret: webhooksTokenSecret,
  //       content_type: "json",
  //     },
  //   },
  // });
  //return data;
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
  const repoNames: Omit<GithubChannelProps, "githubToken">[] = repositories.map(
    (repo: any) => {
      return {
        repoName: repo.name,
        repoOwner: repo.owner.login,
        isInOrganization: repo.isInOrganization,
        isPrivate: repo.isPrivate,
      };
    }
  );
  const promiseArr = repoNames.map((repo) =>
    createChannel({
      ...repo,
      githubToken: githubToken,
    })
  );
  const results = await Promise.all(promiseArr);
  return JSON.stringify(results, null, 4);
};
createWatchChannels()
  .then((e) => console.log(e))
  .catch((err) => {
    console.error(err);
  });
// checkChannelExists({
//   repoName: "Personal-Website-Old",
//   repoOwner: "aasmal97",
//   githubToken: convertToStr(process.env.GIT_HUB_PERSONAL_ACCESS_TOKEN),
// }).then((e) => console.log(e));
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
