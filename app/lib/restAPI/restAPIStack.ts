import * as cdk from "aws-cdk-lib";
import { AttributeType, ProjectionType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import restAPIMap from "./restApiMap";
import { createApi } from "../../../utils/createResources/createApiTree";
import { createDatabase } from "../../../utils/createResources/createDatabase";
import { createAliasRecord } from "../../../utils/createResources/createRecords";
import * as targets from "aws-cdk-lib/aws-route53-targets";

export class RestAPIStack extends cdk.Stack {
  getRestApi: () => cdk.aws_apigateway.RestApi;
  mapAPIToHostedZone: (
    hostingZone: cdk.aws_route53.IHostedZone,
    certificate: cdk.aws_certificatemanager.Certificate
  ) => [cdk.aws_route53.ARecord, cdk.aws_apigateway.RestApi];
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const hobbiesDb = createDatabase({
      stack: this,
      tableName: "hobbies",
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
    const projectsDb = createDatabase({
      stack: this,
      tableName: "projects",
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
        id: hobbiesDb.tableName,
        arn: hobbiesDb.tableArn,
      },
      projects: {
        id: projectsDb.tableName,
        arn: projectsDb.tableArn,
      },
    };
    const api = createApi(this, restAPIMap(this, tablesMap));
    this.getRestApi = () => api;
    this.mapAPIToHostedZone = (zone, certificate) => {
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
