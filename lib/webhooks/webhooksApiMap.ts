import {
  RestAPIType,
  generateLocation,
} from "@utils/createResources/createApiTree";
import { Stack } from "aws-cdk-lib";
import { convertToStr } from "@utils/general/convertToStr";
import { createLambdaRole } from "@utils/rolesFuncs/createLambdaRole";
import { createS3BucketPolicy } from "@utils/rolesFuncs/createS3BucketPolicy";
import { createDynamoPolicy } from "@utils/rolesFuncs/createDynamoPolicy";
import { createGoogleDrivePostStateMachine } from "./resources/googleDrive/googleDrivePost/stepFunction/stateMachine";
import { createStateMachinePolicy } from "@utils/rolesFuncs/createStateMachinePolicy";
import {
  AMAZON_REST_API_DOMAIN_ENV_NAME,
  AMAZON_REST_API_KEY_ENV_NAME,
  AMAZON_REST_API_KEY_ENV_VALUE,
  AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_NAME,
  AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_VALUE,
  AZURE_COMPUTER_VISION_API_KEY_ENV_NAME,
  AZURE_COMPUTER_VISION_API_KEY_ENV_VALUE,
  GITHUB_PERSONAL_ACCESS_TOKEN_ENV_NAME,
  GITHUB_PERSONAL_ACCESS_TOKEN_ENV_VALUE,
  GOOGLE_DRIVE_FOLDER_ENV_NAME,
  GOOGLE_DRIVE_FOLDER_ENV_VALUE,
  GOOGLE_DRIVE_PARENT_FOLDER_ENV_NAME,
  GOOGLE_DRIVE_PARENT_FOLDER_ENV_VALUE,
  GOOGLE_DRIVE_POST_STATE_MACHINE_ARN_ENV_NAME,
  GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_NAME,
  GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_VALUE,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_NAME,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_VALUE,
  S3_MEDIA_FILES_BUCKET_ENV_NAME,
  WEBHOOKS_API_DOMAIN_ENV_NAME,
  WEBHOOKS_API_KEY_ENV_NAME,
  WEBHOOKS_API_KEY_ENV_VALUE,
  WEBHOOKS_API_TOKEN_SECRET_ENV_NAME,
  WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE,
  WEBHOOKS_DYNAMO_DB_TABLE_ENV_NAME,
} from "@lib/constants";
const webhooksApiMap = ({
  webhooksAPIDomainName,
  restApiDomainName,
  s3MediaBucket,
  tableData,
  stack,
}: {
  restApiDomainName?: string;
  stack?: Stack;
  webhooksAPIDomainName?: string;
  s3MediaBucket?: {
    name: string;
    id: string;
    arn: string;
  };
  tableData?: {
    [key: string]: {
      id: string;
      name: string;
      arn: string;
    };
  };
}): RestAPIType => {
  const googleDrivePostStepFunctionLambdaLocation = generateLocation(
    ["googleDrive", "post", "stepFunction"],
    __dirname
  );
  const googlePostDriveStateMachine = createGoogleDrivePostStateMachine({
    stack,
    webhooksAPIDomainName,
    restApiDomainName,
    s3MediaBucket,
    tableData: tableData,
    location: googleDrivePostStepFunctionLambdaLocation,
  });
  return {
    github: {
      post: {
        location: generateLocation(["github", "post"], __dirname),
        env: {
          [AMAZON_REST_API_DOMAIN_ENV_NAME]: convertToStr(restApiDomainName),
          [WEBHOOKS_API_TOKEN_SECRET_ENV_NAME]:
            WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE,
          [AMAZON_REST_API_KEY_ENV_NAME]: AMAZON_REST_API_KEY_ENV_VALUE,
        },
        apiKeyRequired: false,
      },
    },
    googleDrive: {
      post: {
        location: generateLocation(["googleDrive", "post"], __dirname),
        env: {
          [S3_MEDIA_FILES_BUCKET_ENV_NAME]: convertToStr(s3MediaBucket?.name),
          [AMAZON_REST_API_DOMAIN_ENV_NAME]: convertToStr(restApiDomainName),
          [AMAZON_REST_API_KEY_ENV_NAME]: AMAZON_REST_API_KEY_ENV_VALUE,
          [WEBHOOKS_API_DOMAIN_ENV_NAME]: convertToStr(webhooksAPIDomainName),
          [WEBHOOKS_API_TOKEN_SECRET_ENV_NAME]:
            WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE,
          [WEBHOOKS_DYNAMO_DB_TABLE_ENV_NAME]: convertToStr(
            tableData?.["activeWebhooks"].name
          ),
          [WEBHOOKS_API_KEY_ENV_NAME]: WEBHOOKS_API_KEY_ENV_VALUE,
          [AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_NAME]:
            AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_VALUE,
          [AZURE_COMPUTER_VISION_API_KEY_ENV_NAME]:
            AZURE_COMPUTER_VISION_API_KEY_ENV_VALUE,
          [GOOGLE_DRIVE_POST_STATE_MACHINE_ARN_ENV_NAME]: convertToStr(
            googlePostDriveStateMachine?.stateMachineArn
          ),
          [GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_NAME]:
            GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_VALUE,
          [GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_NAME]:
            GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_VALUE,
        },
        memorySize: 768,
        role: createLambdaRole(
          "WebhooksGoogleDrivePostRole",
          {
            googlePostDriveStateMachineRole: googlePostDriveStateMachine
              ? createStateMachinePolicy({
                  stateMachineArn: googlePostDriveStateMachine.stateMachineArn,
                })
              : null,
            webhooksS3PutRole: s3MediaBucket
              ? createS3BucketPolicy("PUT", s3MediaBucket)
              : null,
            webhooksS3DeleteRole: s3MediaBucket
              ? createS3BucketPolicy("DELETE", s3MediaBucket)
              : null,
            webhooksDynamoPutRole: tableData
              ? createDynamoPolicy("PUT", tableData?.["activeWebhooks"])
              : null,
            webhooksDynamoDeleteRole: tableData
              ? createDynamoPolicy("DELETE", tableData?.["activeWebhooks"])
              : null,
            webhooksDynamoGetRole: tableData
              ? createDynamoPolicy("GET", tableData?.["activeWebhooks"])
              : null,
          },
          stack
        ),
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
            [WEBHOOKS_API_DOMAIN_ENV_NAME]: convertToStr(webhooksAPIDomainName),
            [WEBHOOKS_API_TOKEN_SECRET_ENV_NAME]:
              WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE,
            [GITHUB_PERSONAL_ACCESS_TOKEN_ENV_NAME]:
              GITHUB_PERSONAL_ACCESS_TOKEN_ENV_VALUE,
            [AMAZON_REST_API_DOMAIN_ENV_NAME]: convertToStr(restApiDomainName),
            [AMAZON_REST_API_KEY_ENV_NAME]: AMAZON_REST_API_KEY_ENV_VALUE,
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
            [WEBHOOKS_API_DOMAIN_ENV_NAME]: convertToStr(webhooksAPIDomainName),
            [WEBHOOKS_API_TOKEN_SECRET_ENV_NAME]:
              WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE,
            [WEBHOOKS_DYNAMO_DB_TABLE_ENV_NAME]: convertToStr(
              tableData?.["activeWebhooks"].name
            ),
            [GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_NAME]:
              GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_VALUE,
            [GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_NAME]:
              GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_VALUE,
            [GOOGLE_DRIVE_FOLDER_ENV_NAME]: GOOGLE_DRIVE_FOLDER_ENV_VALUE,
            [GOOGLE_DRIVE_PARENT_FOLDER_ENV_NAME]:
              GOOGLE_DRIVE_PARENT_FOLDER_ENV_VALUE,
          },
          role: createLambdaRole(
            "WebhooksGoogleDriveWatchChannelRole",
            {
              webhooksDynamoPostRole: tableData
                ? createDynamoPolicy("POST", tableData?.["activeWebhooks"])
                : null,
              webhooksDynamoPutRole: tableData
                ? createDynamoPolicy("PUT", tableData?.["activeWebhooks"])
                : null,
              webhooksDynamoGetRole: tableData
                ? createDynamoPolicy("GET", tableData?.["activeWebhooks"])
                : null,
              webhooksDynamoDeleteRole: tableData
                ? createDynamoPolicy("DELETE", tableData?.["activeWebhooks"])
                : null,
            },
            stack
          ),
        },
      },
    },
  };
};
export default webhooksApiMap;
