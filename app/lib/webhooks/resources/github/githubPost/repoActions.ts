export type RepoRestApiCallsProps = {
  apiKey: string;
  restApiDomainName: string;
};
import {
  RepositoryEvent,
  RepositoryCreatedEvent,
  RepositoryDeletedEvent,
  RepositoryArchivedEvent,
} from "@octokit/webhooks-types";
import { RepositoryEditedEvent } from "@octokit/webhooks-types";
export const createRepo = ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryCreatedEvent }) => {
  const name = data.repository.name;
};
export const editedRepo = ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryEditedEvent }) => {
  const {
    repository: { name, topics },
    changes: { description },
  } = data;
};
export const deleteRepo = ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryDeletedEvent }) => {
  const name = data.repository.name;
};
export const archivedRepo = ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryArchivedEvent }) => {
  const name = data.repository.name;
};
export const respondToRepositoryChanges = ({
  data,
  apiKey,
  restApiDomainName,
}: RepoRestApiCallsProps & { data: RepositoryEvent }) => {
  const { action } = data;
  let result: any;
  switch (action) {
    case "created":
      result = createRepo({ data, apiKey, restApiDomainName });
      break;
    case "edited":
      result = editedRepo({ data, apiKey, restApiDomainName });

      break;
    case "deleted":
      result = deleteRepo({ data, apiKey, restApiDomainName });

      break;
    case "archived":
      result = archivedRepo({ data, apiKey, restApiDomainName });
      break;
    default:
      break;
  }
};
