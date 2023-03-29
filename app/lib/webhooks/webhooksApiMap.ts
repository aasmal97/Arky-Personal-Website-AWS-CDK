import {
  RestAPIType,
  generateLocation,
} from "../../../utils/createResources/createApiTree";
import { Stack } from "aws-cdk-lib";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import { convertToStr } from "../../../utils/general/convertToStr";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createS3BucketPolicy } from "../../../utils/rolesFuncs/createS3BucketPolicy";
import { createDynamoPolicy } from "../../../utils/rolesFuncs/createDynamoPolicy";
import { createGoogleDrivePostStateMachine } from "./stepFunctions/googleDrivePost/statemachine";
import { createStateMachinePolicy } from "../../../utils/rolesFuncs/createStateMachinePolicy";
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
  const parsed = searchForSecretsWrapper(__dirname);
  const googleDrivePostStepFunctionLambdaLocation = generateLocation(
    ["stepFunctions", "googleDrivePost"],
    __dirname,
    true
  );
  const googlePostDriveStateMachine = createGoogleDrivePostStateMachine({
    stack,
    parsed,
    webhooksAPIDomainName,
    restApiDomainName,
    s3MediaBucket,
    tableData,
    location: googleDrivePostStepFunctionLambdaLocation,
  });
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
          GOOGLE_DRIVE_POST_STATE_MACHINE_ARN: convertToStr(
            googlePostDriveStateMachine?.stateMachineArn
          ),
          S3_MEDIA_FILES_BUCKET_NAME: convertToStr(s3MediaBucket?.name),
          AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
          WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
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
            parsed.GOOGLE_SERVICE_ACCOUNT_EMAIL
          ),
          GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: convertToStr(
            parsed.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
          ),
          WEBHOOKS_DYNAMO_DB_TABLE_NAME: convertToStr(
            tableData?.["activeWebhooks"].name
          ),
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
            GIT_HUB_PERSONAL_ACCESS_TOKEN: convertToStr(
              parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            ),
            WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
            WEBHOOKS_API_TOKEN_SECRET: convertToStr(
              parsed.WEBHOOKS_API_TOKEN_SECRET
            ),
            AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
            AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
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
              parsed.GOOGLE_SERVICE_ACCOUNT_EMAIL
            ),
            GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: convertToStr(
              parsed.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
            ),
            WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
            WEBHOOKS_API_TOKEN_SECRET: convertToStr(
              parsed.WEBHOOKS_API_TOKEN_SECRET
            ),
            GOOGLE_DRIVE_FOLDER_NAME: convertToStr(
              parsed.GOOGLE_DRIVE_FOLDER_NAME
            ),
            GOOGLE_DRIVE_PARENT_FOLDER_NAME: convertToStr(
              parsed.GOOGLE_DRIVE_PARENT_FOLDER_NAME
            ),
            WEBHOOKS_DYNAMO_DB_TABLE_NAME: convertToStr(
              tableData?.["activeWebhooks"].name
            ),
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
            },
            stack
          ),
        },
      },
    },
  };
};
export default webhooksApiMap;
