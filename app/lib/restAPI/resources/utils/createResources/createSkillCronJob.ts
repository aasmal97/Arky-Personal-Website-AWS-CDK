import * as cdk from "aws-cdk-lib";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { createLambdaRole } from "../../../../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../../../../utils/rolesFuncs/createDynamoPolicy";
import { createCronEvent } from "../../../../../../utils/createResources/createCronEvent";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import path = require("path");
export const createSkillCronJob = ({
  stack,
  skillsTableInfo,
    secrets,
  dirname
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
  const skillsCronLambda = new PythonFunction(stack, "skillsCronJobLambda", {
    entry: path.join(dirname, "./resources/skills/cronJob"),
    runtime: Runtime.PYTHON_3_9,
    index: "main.py",
    handler: "lambda_handler",
    timeout: cdk.Duration.minutes(14),
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
      LINKED_IN_PASSWORD: secrets.LINKED_IN_PASSWORD,
    },
  });
  const skillsCronJobTarget = new LambdaFunction(skillsCronLambda, {
    retryAttempts: 2,
  });
  const skillsCronJobEvent = createCronEvent({
    stack: stack,
    id: "skillsCronJobEvent",
    hours: 23,
    targets: [skillsCronJobTarget],
  });

  return skillsCronJobEvent;
};
