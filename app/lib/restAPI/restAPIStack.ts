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
    const tablesMap = {
      hobbies: {
        id: hobbiesDbTableName,
        arn: hobbiesDb.tableArn,
      },
      projects: {
        id: projectsDBTableName,
        arn: projectsDb.tableArn,
      },
    };
    let api: cdk.aws_apigateway.RestApi | undefined;
    const parsed = searchForSecretsWrapper(__dirname);
    this.getRestApi = () => api;
    this.createAPI = (hostingStack: HostingStack) => {
      api = createApi(
        this,
        restAPIMap({ hostingStack, stack: this, tablesInfoMap: tablesMap }),
        "rest-api"
      );
      const plan = api.addUsagePlan("restAPIUsagePlan", {
        name: "restAPIKeyEasy",
        throttle: {
          rateLimit: 10,
          burstLimit: 2,
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
        domainName: "api.arkyasmal.com",
        certificate: certificate,
      });
      const record = createAliasRecord({
        stack: this,
        zone: zone,
        id: "restAPIARecord",
        aliasTarget: new targets.ApiGateway(api),
        recordName: "api.arkyasmal.com",
      });
      return [record, api];
    };
  }
}
