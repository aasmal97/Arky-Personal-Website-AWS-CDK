import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { createLambdaRole } from "../../../../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../../../../utils/rolesFuncs/createDynamoPolicy";
import { createCronEvent } from "../../../../../../utils/createResources/createCronEvent";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";

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
  const skillsCronLambda = new lambda.Function(stack, "skillsCronJobLambda", {
    runtime: Runtime.NODEJS_20_X,
    handler: `index.handler`,
    code: lambda.Code.fromAsset(
      path.join(dirname, "./resources/skills/cronJob").toString()
    ),
    timeout: cdk.Duration.minutes(14),
    memorySize: 512,
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
  const skillsCronJobEvent = createCronEvent({
    stack: stack,
    id: "skillsCronJobEvent",
    hours: 72,
    targets: [skillsCronJobTarget],
  });

  return skillsCronJobEvent;
};
