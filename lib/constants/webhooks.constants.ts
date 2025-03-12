import { searchForSecretsWrapper } from "@utils/buildFuncs/searchForSecrets";

//constructs id
export const WEBHOOKS_TABLE_NAME = "activeWebhooksTable" as const;
export const WEBHOOKS_API_GATEWAY_CERTIFICATE_NAME =
  "webhooksCertificate" as const;
export const WEBHOOKS_DOMAIN_API_GATEWAY_NAME =
  "webhooksAPIDefaultDomainName" as const;
export const WEBHOOKS_DOMAIN_NAME_ALIAS_RECORD_NAME =
  "webhooksAPIARecord" as const;
export const WEBHOOKS_API_GATEWAY_NAME = "webhooks-api" as const;
export const WEBHOOKS_API_GATEWAY_USAGE_PLAN = "webhooksUsagePlan" as const;
export const WEBHOOKS_API_GATEWAY_KEY_NAME = "webhooksApiKey" as const;
export const GOOGLE_DRIVE_WATCH_CRON_JOB_NAME =
  "googleDriveWatchChannelJob" as const;
export const GITHUB_WATCH_CRON_JOB_NAME = "githubWatchChannelJob" as const;

//webhooks table key names
export const WEBHOOKS_TABLE_DEFAULT_PK_KEY = "topMostDirectory" as const;
export const WEBHOOKS_TABLE_DEFAULT_SORT_KEY = "id" as const;
export const WEBHOOKS_TABLE_SECONDARY_INDEX_NAME =
  "SearchByExpiration" as const;
export const WEBHOOKS_TABLE_SECONDARY_SORT_KEY = "expiration" as const;
const parsed = searchForSecretsWrapper(__dirname);
//env key names & values
export const WEBHOOKS_API_TOKEN_SECRET_ENV_NAME = "WEBHOOKS_API_TOKEN_SECRET";
export const WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE =
  parsed.WEBHOOKS_API_TOKEN_SECRET as string;
export const WEBHOOKS_API_KEY_ENV_NAME = "WEBHOOKS_API_KEY";
export const WEBHOOKS_API_KEY_ENV_VALUE = parsed.WEBHOOKS_API_KEY as string;
export const WEBHOOKS_API_DOMAIN_ENV_NAME = "WEBHOOKS_API_DOMAIN_NAME";
export const WEBHOOKS_DYNAMO_DB_TABLE_ENV_NAME =
  "WEBHOOKS_DYNAMO_DB_TABLE_NAME";
export const AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_NAME =
  "AZURE_COMPUTER_VISION_API_ENDPOINT";
export const AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_VALUE =
  parsed.AZURE_COMPUTER_VISION_API_ENDPOINT as string;
export const AZURE_COMPUTER_VISION_API_KEY_ENV_NAME =
  "AZURE_COMPUTER_VISION_API_KEY";
export const AZURE_COMPUTER_VISION_API_KEY_ENV_VALUE =
  parsed.AZURE_COMPUTER_VISION_API_KEY as string;
export const GOOGLE_DRIVE_POST_STATE_MACHINE_ARN_ENV_NAME =
  "GOOGLE_DRIVE_POST_STATE_MACHINE_ARN";
export const GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_NAME = "GOOGLE_SERVICE_ACCOUNT_EMAIL";
export const GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_VALUE =
  parsed.GOOGLE_SERVICE_ACCOUNT_EMAIL as string;
export const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_NAME =
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY";
export const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_VALUE =
  parsed.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY as string;

export const GOOGLE_DRIVE_FOLDER_ENV_NAME = "GOOGLE_DRIVE_FOLDER_NAME";
export const GOOGLE_DRIVE_FOLDER_ENV_VALUE =
  parsed.GOOGLE_DRIVE_FOLDER_NAME as string;

export const GOOGLE_DRIVE_PARENT_FOLDER_ENV_NAME =
  "GOOGLE_DRIVE_PARENT_FOLDER_NAME";
export const GOOGLE_DRIVE_PARENT_FOLDER_ENV_VALUE =
  parsed.GOOGLE_DRIVE_PARENT_FOLDER_NAME as string;
