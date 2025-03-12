export const DOMAIN_NAME = "arkyasmal.com" as const;
export const WWW_DOMAIN_NAME = `www.${DOMAIN_NAME}` as const;
export const MEDIA_FILES_DOMAIN_NAME = `mediafiles.${DOMAIN_NAME}` as const;
export const REST_API_DOMAIN_NAME = `api.${DOMAIN_NAME}` as const;
export const WEBHOOKS_DOMAIN_NAME = `webhooks.${DOMAIN_NAME}` as const;
export const CLIENT_APP_DOMAIN_NAME = WWW_DOMAIN_NAME;
export const HOSTED_ZONE_NAME = "arkyasmalCom" as const;
export const WWW_CNAME_RECORD_NAME = "wwwCnameRecord" as const; 
export const GENERAL_CERTIFICATE_NAME = "generalCertificate" as const;
export const MEDIA_FILES_S3_BUCKET_NAME = "arkyasmal-media-files-bucket" as const;
export const CLIENT_CLOUDFRONT_REDIRECT_BEHAVIOR_FUNC_NAME =
    "clientCloudfrontRedirectBehaviorFunc" as const;
export const CLIENT_FILES_S3_BUCKET_NAME = "arkyasmal-client-app-bucket" as const;
export const CLOUDFRONT_CLIENT_ALIAS_RECORD_NAME = "clientCloudfrontAliasRecord" as const;
export const CLOUDFRONT_MEDIA_FILES_ALIAS_RECORD_NAME = "imgCloudfrontAliasRecord" as const; 