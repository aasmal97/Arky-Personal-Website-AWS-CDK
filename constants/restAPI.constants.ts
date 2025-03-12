//infastructure ids
export const REST_API_DOMAIN_NAME_ALIAS_RECORD_NAME = "restAPIARecord" as const;
export const REST_API_DOMAIN_NAME_API_GATEWAY_NAME = "apiDefaultDomainName" as const;
export const REST_API_GATEWAY_NAME = "rest-api" as const;
export const REST_API_KEY_NAME = "RestApiKey" as const;
export const REST_API_USAGE_PLAN_NAME = "restAPIUsagePlan" as const;
export const SKILLS_CRON_JOB_NAME = "skillsCronJob" as const;
export const HOBBIES_DB_TABLE_NAME = "hobbies" as const;
export const PROJECTS_DB_TABLE_NAME = "projects" as const;
export const PROJECTS_IMAGES_DB_TABLE_NAME = "projectImages" as const;
export const SKILLS_DB_TABLE_NAME = "skills" as const;
//hobbies env names 
export const HOBBIES_DB_DEFAULT_PK_KEY = "orientation" as const;
export const HOBBIES_DB_DEFAULT_SORT_KEY = "dateCreated" as const;
export const HOBBIES_DB_SECONDARY_INDEX_NAME = "SortByDateTaken" as const;
export const HOBBIES_DB_SECONDARY_SORT_KEY = "dateTaken" as const;
//project env names
export const PROJECTS_DB_DEFAULT_PK_KEY = "recordType" as const; 
export const PROJECTS_DB_DEFAULT_SORT_KEY = "startDate" as const;
export const PROJECTS_DB_SECONDARY_INDEX_NAME = "SortByDateEnded" as const;
export const PROJECTS_DB_SECONDARY_SORT_KEY = "endDate" as const;
//project images env names
export const PROJECTS_IMAGES_DB_DEFAULT_PK_KEY = "documentId" as const;
export const PROJECTS_IMAGES_DB_DEFAULT_SORT_KEY = "googleResourceId" as const;
//skills env names
export const SKILLS_DB_DEFAULT_PK_KEY = "recordType" as const;
export const SKILLS_DB_DEFAULT_SORT_KEY = "name" as const;
