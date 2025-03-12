import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { createLambdaRole } from "@utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "@utils/rolesFuncs/createDynamoPolicy";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { SKILLS_CRON_JOB_NAME } from "@app/constants";
import path = require("path");

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
  const skillsCronLambda = new NodejsFunction(
    stack,
    `${SKILLS_CRON_JOB_NAME}Lambda`,
    {
      runtime: Runtime.NODEJS_22_X,
      handler: `handler`,
      entry: path
        .join(dirname, "./resources/skills/cronJob/index.ts")
        .toString(),
      timeout: cdk.Duration.minutes(14),
      memorySize: 512,
      bundling: {
        minify: true,
      },
      role: createLambdaRole(
        `${SKILLS_CRON_JOB_NAME}LambdaRole`,
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
    }
  );
  const skillsCronJobTarget = new LambdaFunction(skillsCronLambda, {
    retryAttempts: 1,
  });
  //run every three days
  const skillsCronJobEvent = new Rule(stack, `${SKILLS_CRON_JOB_NAME}Event`, {
    schedule: Schedule.rate(cdk.Duration.days(7)),
    targets: [skillsCronJobTarget],
  });
  return skillsCronJobEvent;
};
