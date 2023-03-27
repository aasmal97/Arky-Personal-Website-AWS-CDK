import * as cdk from "aws-cdk-lib";
import webhooksApiMap from "./webhooksApiMap";
import { Construct } from "constructs";
import { createAliasRecord } from "../../../utils/createResources/createRecords";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { createApi } from "../../../utils/createResources/createApiTree";
import { createCertificate } from "../../../utils/createResources/createCertificate";
import { createApiGatewayCronJob } from "../../../utils/createResources/createCronEvent";
import { convertToStr } from "../../../utils/general/convertToStr";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import { createDatabase } from "../../../utils/createResources/createDatabase";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class WebhooksStack extends cdk.Stack {
  createCertificate: (
    hostingZone: cdk.aws_route53.IHostedZone
  ) => cdk.aws_certificatemanager.Certificate;
  mapAPIToHostedZone: (
    hostingZone: cdk.aws_route53.IHostedZone,
    certificate: cdk.aws_certificatemanager.Certificate
  ) => [cdk.aws_route53.ARecord, cdk.aws_apigateway.RestApi] | null;
  createAPI: (
    restApiDomainName?: string,
    s3MediaBucket?: {
      id: string;
      name: string;
      arn: string;
    }
  ) => cdk.aws_apigateway.RestApi;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    let api: cdk.aws_apigateway.RestApi | undefined;
    const webhooksAPIDomainName = "webhooks.api.arkyasmal.com";
    const parsed = searchForSecretsWrapper(__dirname);
    const webhooksTableName = "activeWebhooksTable";
    const webhooksTable = createDatabase({
      stack: this,
      tableName: webhooksTableName,
      pkName: "topMostDirectory",
      sortKey: "id",
      secondaryIndex: {
        indexName: "SearchByExpiration",
        sortKey: {
          name: "expiration",
          type: dynamodb.AttributeType.NUMBER,
        },
      },
    });
    const tableData = {
      activeWebhooks: {
        id: webhooksTableName,
        name: webhooksTable.tableName,
        arn: webhooksTable.tableArn,
      },
    };
    this.createAPI = (restApiDomainName, s3MediaBucket) => {
      api = createApi(
        this,
        webhooksApiMap({
          webhooksAPIDomainName: webhooksAPIDomainName,
          restApiDomainName: restApiDomainName,
          s3MediaBucket: s3MediaBucket,
          tableData: tableData,
          stack: this,
        }),
        "webhooks-api"
      );
      const plan = api.addUsagePlan("webhooksUsagePlan", {
        name: "webhooksEasyPlan",
        throttle: {
          rateLimit: 20,
          burstLimit: 3,
        },
      });
      //add api key
      const key = api.addApiKey("webhooksApiKey", {
        value: convertToStr(process.env.WEBHOOKS_API_KEY),
      });
      plan.addApiKey(key);
      plan.addApiStage({
        stage: api.deploymentStage,
      });
      const cronProps = {
        stack: this,
        restApi: api,
        hours: 12,
        headerParams: {
          "x-api-key": convertToStr(parsed.WEBHOOKS_API_KEY),
        },
      };
      const driveWatchChannelCron = createApiGatewayCronJob({
        ...cronProps,
        id: "googleDriveWatchChannelJob",
        path: "/watch/googleDriveChannel",
      });
      const githubWatchChannelCron = createApiGatewayCronJob({
        ...cronProps,
        id: "githubWatchChannelJob",
        path: "/watch/githubChannel",
      });
      return api;
    };
    this.createCertificate = (hostedZone) => {
      const webhookDomainNames = {
        [webhooksAPIDomainName]: hostedZone,
      };
      const certificate = createCertificate({
        stack: this,
        certName: "webhooksCertificate",
        primaryDomainName: webhooksAPIDomainName,
        domainValidations: webhookDomainNames,
      });
      return certificate;
    };
    this.mapAPIToHostedZone = (zone, certificate) => {
      if (!api) return null;
      api.addDomainName("webhooksAPIDefaultDomainName", {
        domainName: webhooksAPIDomainName,
        certificate: certificate,
      });
      const record = createAliasRecord({
        stack: this,
        zone: zone,
        id: "webhooksAPIARecord",
        aliasTarget: new targets.ApiGateway(api),
        recordName: webhooksAPIDomainName,
      });
      return [record, api];
    };
  }
}
