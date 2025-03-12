import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Stack, Duration } from "aws-cdk-lib";
import { convertToStr } from "@utils/general/convertToStr";
import { createLambdaRole } from "@utils/rolesFuncs/createLambdaRole";
import { createS3BucketPolicy } from "@utils/rolesFuncs/createS3BucketPolicy";
import { createDynamoPolicy } from "@utils/rolesFuncs/createDynamoPolicy";
import * as logs from "aws-cdk-lib/aws-logs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import {
  AMAZON_REST_API_DOMAIN_ENV_NAME,
  AMAZON_REST_API_KEY_ENV_NAME,
  AMAZON_REST_API_KEY_ENV_VALUE,
  AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_NAME,
  AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_VALUE,
  AZURE_COMPUTER_VISION_API_KEY_ENV_NAME,
  AZURE_COMPUTER_VISION_API_KEY_ENV_VALUE,
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
export const createGoogleDrivePostStateMachine = ({
  stack,
  webhooksAPIDomainName,
  restApiDomainName,
  s3MediaBucket,
  tableData,
  location,
}: {
  location: {
    absolute: string;
    relative: string;
  };
  stack?: Stack;
  restApiDomainName?: string;
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
}) => {
  const googleDrivePostName = "googleDrivePostStepFunction";
  const googleDrivePostStepFunctionLambda = stack
    ? new NodejsFunction(stack, `${googleDrivePostName}Lambda`, {
        runtime: Runtime.NODEJS_22_X,
        entry: join(location.absolute, "index.ts"),
        handler: "handler",
        timeout: Duration.minutes(14),
        bundling: {
          minify: true,
        },
        environment: {
          [S3_MEDIA_FILES_BUCKET_ENV_NAME]: convertToStr(s3MediaBucket?.name),
          [AMAZON_REST_API_DOMAIN_ENV_NAME]: convertToStr(restApiDomainName),
          [AMAZON_REST_API_KEY_ENV_NAME]: AMAZON_REST_API_KEY_ENV_VALUE,
          [WEBHOOKS_API_DOMAIN_ENV_NAME]: convertToStr(webhooksAPIDomainName),
          [WEBHOOKS_API_KEY_ENV_NAME]: WEBHOOKS_API_KEY_ENV_VALUE,
          [WEBHOOKS_API_TOKEN_SECRET_ENV_NAME]:
            WEBHOOKS_API_TOKEN_SECRET_ENV_VALUE,
          [AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_NAME]:
            AZURE_COMPUTER_VISION_API_ENDPOINT_ENV_VALUE,
          [AZURE_COMPUTER_VISION_API_KEY_ENV_NAME]:
            AZURE_COMPUTER_VISION_API_KEY_ENV_VALUE,
          [WEBHOOKS_DYNAMO_DB_TABLE_ENV_NAME]: convertToStr(
            tableData?.["activeWebhooks"].name
          ),
          [GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_NAME]:
            GOOGLE_SERVICE_ACCOUNT_EMAIL_ENV_VALUE,
          [GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_NAME]:
            GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ENV_VALUE,
        },
        memorySize: 5000,
        role: createLambdaRole(
          "WebhooksGoogleDriveStepFunctionPostRole",
          {
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
      })
    : null;
  const modifyResourcesJob =
    stack && googleDrivePostStepFunctionLambda
      ? new tasks.LambdaInvoke(
          stack,
          `${googleDrivePostName}ModifyResourcesTask`,
          {
            lambdaFunction: googleDrivePostStepFunctionLambda,
            outputPath: "$.Payload",
          }
        )
      : null;
  const googleDrivePostDefintion = modifyResourcesJob;
  const googleDrivePostStateMachine =
    stack && googleDrivePostDefintion
      ? new sfn.StateMachine(stack, `${googleDrivePostName}StateMachine`, {
          definitionBody: sfn.DefinitionBody.fromChainable(
            googleDrivePostDefintion
          ),
          timeout: Duration.minutes(14),
          logs: {
            destination: new logs.LogGroup(
              stack,
              `${googleDrivePostName}LogGroup`
            ),
            level: sfn.LogLevel.ALL,
            includeExecutionData: true,
          },
        })
      : null;
  return googleDrivePostStateMachine;
};
