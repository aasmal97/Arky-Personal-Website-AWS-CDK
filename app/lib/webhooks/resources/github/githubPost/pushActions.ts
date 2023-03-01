
// import { RepoRestApiCallsProps } from "./repoActions";
// import { PushEvent } from "@octokit/webhooks-types";
// export const respondToPushChanges = async ({
//   data,
//   apiKey,
//   restApiDomainName,
// }: RepoRestApiCallsProps & { data: PushEvent }) => {
//   const { repository, commits } = data;
//   let result: any;
//   switch (action) {
//     case "created":
//       result = await createRepo({ data, apiKey, restApiDomainName });
//       break;
//     case "edited":
//       result = await editedRepo({ data, apiKey, restApiDomainName });

//       break;
//     case "deleted":
//       result = await deleteRepo({ data, apiKey, restApiDomainName });

//       break;
//     case "archived":
//       result = await archivedRepo({ data, apiKey, restApiDomainName });
//       break;
//     case "renamed":
//       result = await renamedRepo({
//         data,
//         apiKey,
//         restApiDomainName,
//       });
//       break;
//     default:
//       break;
//   }
// };
