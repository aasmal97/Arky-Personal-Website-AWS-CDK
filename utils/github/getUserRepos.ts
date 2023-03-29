import axios from "axios";
// import * as dotenv from "dotenv";
// dotenv.config();
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
export const getRepositories = async (token?: string) => {
  const username = "aasmal97";
  const query = `query {
    user(login: "${username}"){
      repositories(first: 100, affiliations:[OWNER, ORGANIZATION_MEMBER, COLLABORATOR], ownerAffiliations:[OWNER, ORGANIZATION_MEMBER, COLLABORATOR]) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes{
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
export const getRepoCount = async (token?:string) => {
  const data = await getRepositories(token);
  const repoCount = data.data.user.repositories.totalCount;
  return repoCount;
};
