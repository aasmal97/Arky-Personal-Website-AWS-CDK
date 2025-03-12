export const WEBHOOKS_TABLE_NAME = "activeWebhooksTable" as const;
export const WEBHOOKS_TABLE_DEFAULT_PK_KEY = "topMostDirectory" as const;
export const WEBHOOKS_TABLE_DEFAULT_SORT_KEY = "id" as const;
export const WEBHOOKS_TABLE_SECONDARY_INDEX_NAME =
  "SearchByExpiration" as const;
export const WEBHOOKS_TABLE_SECONDARY_SORT_KEY = "expiration" as const;

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
