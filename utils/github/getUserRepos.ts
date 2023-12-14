import axios from "axios";
import { ignoreOrganization } from "../../app/lib/webhooks/resources/github/githubPost/ignoreRepoList";
export const callGithubGraphQL = async ({
  query,
  variables,
  token,
}: {
  token?: string;
  query: string;
  variables?: { [key: string]: string };
}) => {
  const { data } = await axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      query: query,
      variables: variables,
    },
  });
  return data;
};
export const getOrgRepos = async ({
  token,
  org,
  cursor = null,
}: {
  token?: string;
  org: string;
  cursor?: string | null;
}) => {
  const query = `query {
    viewer{
      organization(login: "${org}"){
          repositories(first:100, after:${
            cursor ? `"${cursor}"` : cursor
          }){
            totalCount
            pageInfo {
              endCursor
              hasNextPage
            }      
            nodes {
              id
              name
            }
          }
      }
    }
  }
   `;
  const data = await callGithubGraphQL({
    token,
    query,
  });
  return data;
};
export const getAllGithubOrgRepos = async({
  token,
  org
}:{
  token: string
  org: string
}) => {
  const repositories: any[] = [];
  let hasEnded = false;
  let nextCursor: string | null = null;
  while (!hasEnded) {
    try {
      const {
        data: {
          search: {
            edges: newRepositories,
            pageInfo: { endCursor, hasNextPage },
          },
        },
      } = await getOrgRepos({
        token, org, cursor: nextCursor,
      });
      hasEnded = !hasNextPage as boolean;
      nextCursor = endCursor as string;
      repositories.push(...newRepositories.map((repo: any) => repo.node));
    } catch (err) {
      console.log(err);
      break;
    }
  }
  return repositories
}
export const getRepositories = async ({
  token,
  cursor = null,
}: {
  token?: string;
  cursor?: string | null;
}) => {
  const username = "aasmal97";
  const query = `query {
    user(login: "${username}"){
      repositories(first: 100, after:${
        cursor ? `"${cursor}"` : cursor
      }, affiliations:[OWNER, ORGANIZATION_MEMBER, COLLABORATOR],ownerAffiliations:[OWNER, ORGANIZATION_MEMBER, COLLABORATOR]) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes{
            id
            name
            isInOrganization
            isPrivate
            url
            homepageUrl
            description
            createdAt
            repositoryTopics(first: 100) {
              nodes {
                topic {
                  name
                }
              }
            }
            owner {
              login
              url
            }
          }
        }
     }
   }
   `;
  const data = await callGithubGraphQL({
    token,
    query,
  });
  return data;
};
export const getAllGithubRepos = async({
  token
}:{
  token: string
}) => {
  const repositories: any[] = [];
  let hasEnded = false;
  let nextCursor: string | null = null;
  while (!hasEnded) {
    try {
      const {
        data: {
          user: {
            repositories: {
              nodes: newRepositories,
              pageInfo: { endCursor, hasNextPage },
            },
          },
        },
      } = await getRepositories({
        token,
        cursor: nextCursor,
      });
      hasEnded = !hasNextPage as boolean;
      nextCursor = endCursor as string;
      repositories.push(...newRepositories);
    } catch (err) {
      console.log(err);
      break;
    }
  }
  return repositories
}
export const getRepoCount = async (token?: string) => {
  const orgRepoCountsPromise = Object.entries(ignoreOrganization).map(
    ([key, value]) => getOrgRepos({ token, org: key})
  );
  const dataPromise = getRepositories({ token });
  const results = await Promise.all([...orgRepoCountsPromise, dataPromise]);
  const data = results.pop();
  const totalOrgCount = results.reduce(
    (acc, cur) => acc + cur.data.viewer.organization.repositories.totalCount,
    0
  );
  const repoCount = data.data.user.repositories.totalCount - totalOrgCount;
  return repoCount;
};
