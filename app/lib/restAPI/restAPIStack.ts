import * as cdk from "aws-cdk-lib";
import { AttributeType, ProjectionType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import restAPIMap from "./restApiMap";
import { createApi } from "../../../utils/createResources/createApiTree";
import { createDatabase } from "../../../utils/createResources/createDatabase";
import { createAliasRecord } from "../../../utils/createResources/createRecords";
import { HostingStack } from "../hosting/hostingStack";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../utils/rolesFuncs/createDynamoPolicy";
import { createCronEvent } from "../../../utils/createResources/createCronEvent";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import path = require('path')
export const createSkillCronJob = ({
  stack,
  skillsTableInfo,
  secrets,
}: {
  stack: cdk.Stack;
  skillsTableInfo: {
    name: string;
    id: string;
    arn: string;
  };
  secrets: { [key: string]: any };
}) => {
  const skillsCronLambda = new PythonFunction(stack, "skillsCronJobLambda", {
    entry: path.join(__dirname, "./resources/skills/cronJob"),
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
  const skillsCronJobTarget = new LambdaFunction(skillsCronLambda);
  const skillsCronJobEvent = createCronEvent({
    stack: stack,
    id: "skillsCronJobEvent",
    hours: 23,
    targets: [skillsCronJobTarget],
  });

  return skillsCronJobEvent;
};
export class RestAPIStack extends cdk.Stack {
  createAPI: (e: HostingStack) => cdk.aws_apigateway.RestApi;
  getRestApi: () => cdk.aws_apigateway.RestApi | undefined;
  mapAPIToHostedZone: (
    hostingZone: cdk.aws_route53.IHostedZone,
    certificate: cdk.aws_certificatemanager.Certificate
  ) => [cdk.aws_route53.ARecord, cdk.aws_apigateway.RestApi] | null;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const hobbiesDbTableName = "hobbies";
    const hobbiesDb = createDatabase({
      stack: this,
      tableName: hobbiesDbTableName,
      pkName: "orientation",
      sortKey: "dateCreated",
      secondaryIndex: {
        indexName: "SortByDateTaken",
        sortKey: {
          name: "dateTaken",
          type: AttributeType.STRING,
        },
        projectionType: ProjectionType.ALL,
      },
    });
    const projectsDBTableName = "projects";
    const projectsDb = createDatabase({
      stack: this,
      tableName: projectsDBTableName,
      pkName: "recordType",
      sortKey: "startDate",
      secondaryIndex: {
        indexName: "SortByDateEnded",
        sortKey: {
          name: "endDate",
          type: AttributeType.STRING,
        },
        projectionType: ProjectionType.ALL,
      },
    });
    const projectImagesDBTableName = "projectImages";
    const projectImagesDb = createDatabase({
      stack: this,
      tableName: projectImagesDBTableName,
      pkName: "documentId",
      sortKey: "googleResourceId",
    });
    const skillsDBTableName = "skills";
    const skillsDb = createDatabase({
      stack: this,
      tableName: skillsDBTableName,
      pkName: "recordType",
      sortKey: "name",
    });
    const skillsTableInfo = {
      id: skillsDb.tableName,
      arn: skillsDb.tableArn,
      name: skillsDBTableName,
    };
    const tablesMap = {
      hobbies: {
        name: hobbiesDb.tableName,
        id: hobbiesDbTableName,
        arn: hobbiesDb.tableArn,
      },
      projects: {
        name: projectsDb.tableName,
        id: projectsDBTableName,
        arn: projectsDb.tableArn,
      },
      projectImages: {
        name: projectImagesDb.tableName,
        id: projectImagesDBTableName,
        arn: projectImagesDb.tableArn,
      },
    };
    const restApiDomainName = "api.arkyasmal.com";
    let api: cdk.aws_apigateway.RestApi | undefined;
    const parsed = searchForSecretsWrapper(__dirname);
    createSkillCronJob({
      stack: this,
      skillsTableInfo,
      secrets: parsed,
    });
    this.getRestApi = () => api;
    this.createAPI = (hostingStack: HostingStack) => {
      api = createApi(
        this,
        restAPIMap({
          hostingStack,
          stack: this,
          tablesInfoMap: tablesMap,
          restApiDomainName: restApiDomainName,
        }),
        "rest-api"
      );
      const plan = api.addUsagePlan("restAPIUsagePlan", {
        name: "restAPIKeyEasy",
        throttle: {
          rateLimit: 200,
          burstLimit: 30,
        },
      });
      const key = api.addApiKey("RestApiKey", {
        value: parsed.AMAZON_REST_API_KEY,
      });
      plan.addApiKey(key);
      plan.addApiStage({
        stage: api.deploymentStage,
      });
      return api;
    };

    this.mapAPIToHostedZone = (zone, certificate) => {
      if (!api) return null;
      api.addDomainName("apiDefaultDomainName", {
        domainName: restApiDomainName,
        certificate: certificate,
      });
      const record = createAliasRecord({
        stack: this,
        zone: zone,
        id: "restAPIARecord",
        aliasTarget: new targets.ApiGateway(api),
        recordName: restApiDomainName,
      });
      return [record, api];
    };
  }
}
