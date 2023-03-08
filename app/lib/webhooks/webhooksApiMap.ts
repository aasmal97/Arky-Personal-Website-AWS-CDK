import {
  RestAPIType,
  generateLocation,
} from "../../../utils/createResources/createApiTree";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import { convertToStr } from "../../../utils/general/convertToStr";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createS3BucketPolicy } from "../../../utils/rolesFuncs/createS3BucketPolicy";
import { camelCase } from "lodash";
const webhooksApiMap = ({
  webhooksAPIDomainName,
  restApiDomainName,
  s3MediaBucket,
}: {
  restApiDomainName?: string;
  webhooksAPIDomainName?: string;
  s3MediaBucket?: {
    name: string;
    arn: string;
  };
}): RestAPIType => {
  const parsed = searchForSecretsWrapper(__dirname);
  return {
    github: {
      post: {
        location: generateLocation(["github", "post"], __dirname),
        env: {
          AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
          WEBHOOKS_API_TOKEN_SECRET: convertToStr(
            parsed.WEBHOOKS_API_TOKEN_SECRET
          ),
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
        },
        apiKeyRequired: false,
      },
    },
    googleDrive: {
      post: {
        location: generateLocation(["googleDrive", "post"], __dirname),
        env: {
          S3_MEDIA_FILES_BUCKET_NAME: convertToStr(s3MediaBucket?.name),
          AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
          WEBHOOKS_API_KEY: convertToStr(parsed.WEBHOOKS_API_KEY),
          WEBHOOKS_API_TOKEN_SECRET: convertToStr(
            parsed.WEBHOOKS_API_TOKEN_SECRET
          ),
          AZURE_COMPUTER_VISION_API_ENDPOINT: convertToStr(
            parsed.AZURE_COMPUTER_VISION_API_ENDPOINT
          ),
          AZURE_COMPUTER_VISION_API_KEY: convertToStr(
            parsed.AZURE_COMPUTER_VISION_API_KEY
          ),
          GOOGLE_SERVICE_ACCOUNT_EMAIL: convertToStr(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
          ),
          GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: convertToStr(
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
          ),
        },
        role: createLambdaRole("WebhooksGoogleDrivePostRole", {
          webhooksS3PutRole: createS3BucketPolicy("PUT", {
            id: camelCase(s3MediaBucket?.name),
            arn: camelCase(s3MediaBucket?.arn),
          }),
          webhooksS3DeleteRole: createS3BucketPolicy("DELETE", {
            id: camelCase(s3MediaBucket?.name),
            arn: camelCase(s3MediaBucket?.arn),
          }),
        }),
        apiKeyRequired: false,
      },
    },
    watch: {
      githubChannel: {
        put: {
          location: generateLocation(
            ["watch", "githubChannel", "put"],
            __dirname
          ),
          env: {
            GIT_HUB_PERSONAL_ACCESS_TOKEN: convertToStr(
              parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            ),
            WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
            WEBHOOKS_API_TOKEN_SECRET: convertToStr(
              parsed.WEBHOOKS_API_TOKEN_SECRET
            ),
          },
        },
      },
      googleDriveChannel: {
        put: {
          location: generateLocation(
            ["watch", "googleDriveChannel", "put"],
            __dirname
          ),
          env: {
            GOOGLE_SERVICE_ACCOUNT_EMAIL: convertToStr(
              process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
            ),
            GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: convertToStr(
              process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
            ),
            WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
            WEBHOOKS_API_TOKEN: convertToStr(parsed.WEBHOOKS_API_TOKEN),
            GOOGLE_DRIVE_FOLDER_NAME: convertToStr(
              parsed.GOOGLE_DRIVE_FOLDER_NAME
            ),
            GOOGLE_DRIVE_PARENT_FOLDER_NAME: convertToStr(
              process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME
            ),
          },
        },
      },
    },
  };
};
export default webhooksApiMap;
