import { searchForSecretsWrapper } from "@utils/buildFuncs/searchForSecrets";
//construct ids
export const REST_API_DOMAIN_NAME_ALIAS_RECORD_NAME = "restAPIARecord" as const;
export const REST_API_DOMAIN_NAME_API_GATEWAY_NAME =
  "apiDefaultDomainName" as const;
export const REST_API_GATEWAY_NAME = "rest-api" as const;
export const REST_API_KEY_NAME = "RestApiKey" as const;
export const REST_API_USAGE_PLAN_NAME = "restAPIUsagePlan" as const;
export const SKILLS_CRON_JOB_NAME = "skillsCronJob" as const;
export const USER_METRICS_CRON_JOB_NAME = 'userMetricCronJob' as const;
export const HOBBIES_DB_TABLE_NAME = "hobbies" as const;
export const PROJECTS_DB_TABLE_NAME = "projects" as const;
export const PROJECTS_IMAGES_DB_TABLE_NAME = "projectImages" as const;
export const SKILLS_DB_TABLE_NAME = "skills" as const;
export const METRIC_DB_TABLE_NAME = "metrics" as const;
//hobbies table key names
export const HOBBIES_DB_DEFAULT_PK_KEY = "orientation" as const;
export const HOBBIES_DB_DEFAULT_SORT_KEY = "dateCreated" as const;
export const HOBBIES_DB_SECONDARY_INDEX_NAME = "SortByDateTaken" as const;
export const HOBBIES_DB_SECONDARY_SORT_KEY = "dateTaken" as const;
//project table key names
export const PROJECTS_DB_DEFAULT_PK_KEY = "recordType" as const;
export const PROJECTS_DB_DEFAULT_SORT_KEY = "startDate" as const;
export const PROJECTS_DB_SECONDARY_INDEX_NAME = "SortByDateEnded" as const;
export const PROJECTS_DB_SECONDARY_SORT_KEY = "endDate" as const;
//project images table key names
export const PROJECTS_IMAGES_DB_DEFAULT_PK_KEY = "documentId" as const;
export const PROJECTS_IMAGES_DB_DEFAULT_SORT_KEY = "googleResourceId" as const;
//skills table key names
export const SKILLS_DB_DEFAULT_PK_KEY = "recordType" as const;
export const SKILLS_DB_DEFAULT_SORT_KEY = "name" as const;
//metric table key names
export const METRICS_DB_DEFAULT_PK_KEY = "metricType" as const;
export const METRICS_DB_DEFAULT_SORT_KEY = "dateModified" as const;
const parsed = searchForSecretsWrapper(__dirname);
//env key names & values
export const GITHUB_PERSONAL_ACCESS_TOKEN_ENV_NAME =
  "GIT_HUB_PERSONAL_ACCESS_TOKEN";
export const GITHUB_PERSONAL_ACCESS_TOKEN_ENV_VALUE = parsed[
  GITHUB_PERSONAL_ACCESS_TOKEN_ENV_NAME
] as string;
export const SES_EMAIL_ADDRESS_ENV_NAME = "SES_EMAIL_ADDRESS";
export const SES_EMAIL_ADDRESS_ENV_VALUE = parsed.SES_EMAIL_ADDRESS as string;
export const SNS_PHONE_NUMBER_ENV_NAME = "SNS_PHONE_NUMBER";
export const SNS_PHONE_NUMBER_ENV_VALUE = parsed.SNS_PHONE_NUMBER as string;
export const SEND_IN_BLUE_API_KEY_ENV_NAME = "SEND_IN_BLUE_API_KEY";
export const SEND_IN_BLUE_API_KEY_ENV_VALUE =
  parsed.SEND_IN_BLUE_API_KEY as string;
export const AMAZON_REST_API_KEY_ENV_NAME = "AMAZON_REST_API_KEY";
export const AMAZON_REST_API_KEY_ENV_VALUE =
  parsed.AMAZON_REST_API_KEY as string;
export const AMAZON_DYNAMO_DB_HOBBIES_TABLE_ENV_NAME =
  "AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME";
export const AMAZON_REST_API_DOMAIN_ENV_NAME = "AMAZON_REST_API_DOMAIN_NAME";
export const AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_ENV_NAME =
  "AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME";
export const AMAZON_DYNAMO_DB_PROJECT_TABLE_ENV_NAME =
  "AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME";
export const AMAZON_DYNAMO_DB_SKILLS_TABLE_ENV_NAME =
  "AMAZON_DYNAMO_DB_SKILLS_TABLE_NAME";
  export const AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME =
  "AMAZON_DYNAMO_DB_METRICS_TABLE_NAME";
export const S3_MEDIA_FILES_BUCKET_ENV_NAME = "S3_MEDIA_FILES_BUCKET_NAME";
export const PROXYCURL_TOKEN_ENV_NAME = "PROXYCURL_TOKEN";
export const PROXYCURL_TOKEN_ENV_VALUE = parsed.PROXYCURL_TOKEN as string;
