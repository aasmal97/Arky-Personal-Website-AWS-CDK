import {
  RepositoryEvent,
  RepositoryCreatedEvent,
  RepositoryDeletedEvent,
  RepositoryArchivedEvent,
  RepositoryRenamedEvent,
} from "@octokit/webhooks-types";
import { RepositoryEditedEvent } from "@octokit/webhooks-types";
import axios from "axios";
export type RepoRestApiCallsProps = {
  apiKey: string;
  restApiDomainName: string;
};
export const findRepoDocument = async ({
  apiKey,
  restApiDomainName,
  params,
}: { params: { [key: string]: any } } & RepoRestApiCallsProps) => {
  const url = `https://${restApiDomainName}/projects`;
  const getItem = await axios({
    url: url,
    method: "get",
    headers: {
      "x-api-key": apiKey,
    },
    params: {
      ...params,
      recordType: "projects",
    },
  });
  const result = getItem.data[0];
  return result;
};
export const createRepo = async ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryCreatedEvent }) => {
  const { name, description, created_at } = data.repository;
  const url = `https://${restApiDomainName}/projects`;
  const req = await axios({
    method: "put",
    headers: {
      "x-api-key": apiKey,
    },
    data: {
      projectName: name,
      githubURL: url,
      description: description,
      startDate: new Date(created_at).toISOString(),
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
  const document = await findRepoDocument({
    apiKey,
    restApiDomainName,
    params: {
      projectName: name,
    },
  });
  const req = await axios({
    url: `https://${restApiDomainName}/projects`,
    method: "post",
    headers: {
      "x-api-key": apiKey,
    },
    data: {
      key: document.pk,
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
  const document = await findRepoDocument({
    apiKey,
    restApiDomainName,
    params: {
      projectName: name,
    },
  });
  const url = `https://${restApiDomainName}/projects`;
  const req = await axios({
    url: url,
    method: "delete",
    headers: {
      "x-api-key": apiKey,
    },
    params: {
      key: document.pk,
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
  const document = await findRepoDocument({
    apiKey,
    restApiDomainName,
    params: {
      projectName: name,
    },
  });
  const req = await axios({
    url: `https://${restApiDomainName}/projects`,
    method: "post",
    headers: {
      "x-api-key": apiKey,
    },
    data: {
      key: document.pk,
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
  const document = await findRepoDocument({
    apiKey,
    restApiDomainName,
    params: {
      projectName: oldName,
    },
  });
  const req = await axios({
    url: `https://${restApiDomainName}/projects`,
    method: "post",
    headers: {
      "x-api-key": apiKey,
    },
    data: {
      key: document.pk,
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
      result = await createRepo({ data, apiKey, restApiDomainName });
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
  return result
};
