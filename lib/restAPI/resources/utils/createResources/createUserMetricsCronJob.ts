import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { createLambdaRole } from "@utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "@utils/rolesFuncs/createDynamoPolicy";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import {
  AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME,
  GITHUB_PERSONAL_ACCESS_TOKEN_ENV_NAME,
  GITHUB_PERSONAL_ACCESS_TOKEN_ENV_VALUE,
  USER_METRICS_CRON_JOB_NAME,
} from "@lib/constants";
import path = require("path");
export const createUserMetricCronJob = ({
  stack,
  userMetricsTableInfo,
  dirname,
}: {
  dirname: string;
  stack: cdk.Stack;
  userMetricsTableInfo: {
    name: string;
    id: string;
    arn: string;
  };
}) => {
  const userMetricsCronLambda = new NodejsFunction(
    stack,
    `${USER_METRICS_CRON_JOB_NAME}Lambda`,
    {
      runtime: Runtime.NODEJS_22_X,
      handler: `handler`,
      entry: path
        .join(dirname, "./resources/userMetrics/cronJob/index.ts")
        .toString(),
      timeout: cdk.Duration.minutes(14),
      memorySize: 512,
      bundling: {
        minify: true,
      },
      role: createLambdaRole(
        `${USER_METRICS_CRON_JOB_NAME}LambdaRole`,
        {
          userMetricsGetDynamoDBPolicy: createDynamoPolicy(
            "GET",
            userMetricsTableInfo
          ),
          userMetricsPutDynamoDBPolicy: createDynamoPolicy(
            "PUT",
            userMetricsTableInfo
          ),
          userMetricsPostDynamoDBPolicy: createDynamoPolicy(
            "POST",
            userMetricsTableInfo
          ),
        },
        stack
      ),
      environment: {
        [AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME]: userMetricsTableInfo.name,
        [GITHUB_PERSONAL_ACCESS_TOKEN_ENV_NAME]:
          GITHUB_PERSONAL_ACCESS_TOKEN_ENV_VALUE,
      },
    }
  );
  const userMetricsCronJobTarget = new LambdaFunction(userMetricsCronLambda, {
    retryAttempts: 1,
  });
  //run every three days
  const UserMetricsCronJobEvent = new Rule(
    stack,
    `${USER_METRICS_CRON_JOB_NAME}Event`,
    {
      schedule: Schedule.rate(cdk.Duration.days(1)),
      targets: [userMetricsCronJobTarget],
    }
  );
  return UserMetricsCronJobEvent;
};
