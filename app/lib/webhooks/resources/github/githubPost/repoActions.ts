import {
  RepositoryEvent,
  RepositoryCreatedEvent,
  RepositoryDeletedEvent,
  RepositoryArchivedEvent,
  RepositoryRenamedEvent,
} from "@octokit/webhooks-types";
import { RepositoryEditedEvent } from "@octokit/webhooks-types";
import { getDocuments } from "../../../../../../utils/crudRestApiMethods/getMethod";
import { updateDocument } from "../../../../../../utils/crudRestApiMethods/postMethod";
import { deleteDocument } from "../../../../../../utils/crudRestApiMethods/deleteMethod";
import { putDocument } from "../../../../../../utils/crudRestApiMethods/putMethod";
export type RepoRestApiCallsProps = {
  apiKey: string;
  restApiDomainName: string;
};
export const createRepo = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryCreatedEvent["repository"] }) => {
  const { name, description, created_at, topics, homepage, html_url } = data;
  const req = await putDocument({
    apiKey,
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    data: {
      projectName: name,
      githubURL: html_url,
      description: description,
      startDate: new Date(created_at).toISOString(),
      topics: topics,
      appURL: homepage,
    },
  });
  return req.data;
};
export const editedRepo = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryEditedEvent }) => {
  const {
    repository: { name, topics, description, homepage, html_url },
  } = data;
  const document = await getDocuments({
    apiKey,
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    params: {
      query: JSON.stringify({
        projectName: name,
      }),
      max: 1,
    },
  });
    if (document.data.result.Items.length <= 0)
      return await createRepo({
        data: data.repository,
        apiKey,
        restApiDomainName,
      });
  const req = await updateDocument({
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    apiKey,
    data: {
      key: document.data.result.Items[0].pk,
      description: description,
      projectName: name,
      topics: topics,
      appURL: homepage,
      githubURL: html_url,
    },
  });
  return req.data;
};

export const deleteRepo = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryDeletedEvent }) => {
  const { name } = data.repository;
  const document = await getDocuments({
    apiKey,
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    params: {
      query: JSON.stringify({
        projectName: name,
      }),
      max: 1,
    },
  });
  const req = await deleteDocument({
    addedRoute: "projects",
    restApiUrl: restApiDomainName,
    apiKey,
    params: {
      key: JSON.stringify(document.data.result.Items[0].pk),
    },
  });
  return req.data;
};
export const archivedRepo = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryArchivedEvent }) => {
  const { name, archived } = data.repository;
  const document = await getDocuments({
    apiKey,
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    params: {
      query: JSON.stringify({
        projectName: name,
      }),
      max: 1,
    },
  });
    if (document.data.result.Items.length <= 0)
      return await createRepo({
        data: data.repository,
        apiKey,
        restApiDomainName,
      });
  const req = await updateDocument({
    apiKey,
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    data: {
      key: document.data.result.Items[0].pk,
      archived: archived,
    },
  });
  return req.data;
};
export const renamedRepo = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryRenamedEvent }) => {
  const {
    changes: {
      repository: {
        name: { from: oldName },
      },
    },
    repository: { name },
  } = data;
  const document = await getDocuments({
    apiKey,
    restApiUrl: restApiDomainName,
    addedRoute: "projects",
    params: {
      query: JSON.stringify({ projectName: oldName }),
      max: 1,
    },
  });
    if (document.data.result.Items.length <= 0)
      return await createRepo({
        data: data.repository,
        apiKey,
        restApiDomainName,
      });

  const req = await updateDocument({
    addedRoute: "projects",
    apiKey,
    restApiUrl: restApiDomainName,
    data: {
      key: document.data.result.Items[0].pk,
      projectName: name,
    },
  });
  return req.data;
};
export const respondToRepositoryChanges = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryEvent }) => {
  const { action } = data;
  let result: any;
  switch (action) {
    case "created":
      result = await createRepo({
        data: data.repository,
        apiKey,
        restApiDomainName,
      });
      break;
    case "edited":
      result = await editedRepo({ data, apiKey, restApiDomainName });
      break;
    case "deleted":
      result = await deleteRepo({ data, apiKey, restApiDomainName });
      break;
    case "archived":
      result = await archivedRepo({ data, apiKey, restApiDomainName });
      break;
    case "renamed":
      result = await renamedRepo({
        data,
        apiKey,
        restApiDomainName,
      });
      break;
    default:
      break;
  }
  return result;
};
