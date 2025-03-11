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
export const createGoogleDrivePostStateMachine = ({
  stack,
  parsed,
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
  parsed: {
    [key: string]: string | undefined;
  };
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
        runtime: Runtime.NODEJS_20_X,
        entry: join(location.absolute, "index.ts"),
        handler: "handler",
        timeout: Duration.minutes(14),
        bundling: {
          minify: true,
        },
        environment: {
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
