import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { createLambdaRole } from "@utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "@utils/rolesFuncs/createDynamoPolicy";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import path = require("path");
import { Rule, Schedule } from "aws-cdk-lib/aws-events";

export const createSkillCronJob = ({
  stack,
  skillsTableInfo,
  secrets,
  dirname,
}: {
  dirname: string;
  stack: cdk.Stack;
  skillsTableInfo: {
    name: string;
    id: string;
    arn: string;
  };
  secrets: { [key: string]: any };
}) => {
  const skillsCronLambda = new NodejsFunction(stack, "skillsCronJobLambda", {
    runtime: Runtime.NODEJS_20_X,
    handler: `handler`,
    entry: path.join(dirname, "./resources/skills/cronJob/index.ts").toString(),
    timeout: cdk.Duration.minutes(14),
    memorySize: 512,
    bundling: {
      minify: true,
    },
    role: createLambdaRole(
      "skillsCronJobLambdaRole",
      {
        skillsGetDynamoDBPolicy: createDynamoPolicy("GET", skillsTableInfo),
        skillsPutDynamoDBPolicy: createDynamoPolicy("PUT", skillsTableInfo),
        skillsPostDynamoDBPolicy: createDynamoPolicy("POST", skillsTableInfo),
        skillsDeleteDynamoDBPolicy: createDynamoPolicy(
          "DELETE",
          skillsTableInfo
        ),
      },
      stack
    ),
    environment: {
      AMAZON_DYNAMO_DB_TABLE_NAME: skillsTableInfo.name,
      PROXYCURL_TOKEN: secrets.PROXYCURL_TOKEN,
    },
  });
  const skillsCronJobTarget = new LambdaFunction(skillsCronLambda, {
    retryAttempts: 1,
  });
  //run every three days
  const skillsCronJobEvent = new Rule(stack, "skillsCronJobEvent", {
    schedule: Schedule.rate(cdk.Duration.days(7)),
    targets: [skillsCronJobTarget],
  });
  return skillsCronJobEvent;
};
