import * as cdk from "aws-cdk-lib";
import webhooksApiMap from "./webhooksApiMap";
import { Construct } from "constructs";
import { createAliasRecord } from "@utils/createResources/createRecords";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { createApi } from "@utils/createResources/createApiTree";
import { createCertificate } from "@utils/createResources/createCertificate";
import { createApiGatewayCronJob } from "@utils/createResources/createCronEvent";
import { convertToStr } from "@utils/general/convertToStr";
import { searchForSecretsWrapper } from "@utils/buildFuncs/searchForSecrets";
import { createDatabase } from "@utils/createResources/createDatabase";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {
  GITHUB_WATCH_CRON_JOB_NAME,
  GOOGLE_DRIVE_WATCH_CRON_JOB_NAME,
  WEBHOOKS_API_GATEWAY_CERTIFICATE_NAME,
  WEBHOOKS_API_GATEWAY_KEY_NAME,
  WEBHOOKS_API_GATEWAY_NAME,
  WEBHOOKS_API_GATEWAY_USAGE_PLAN,
  WEBHOOKS_DOMAIN_API_GATEWAY_NAME,
  WEBHOOKS_DOMAIN_NAME,
  WEBHOOKS_DOMAIN_NAME_ALIAS_RECORD_NAME,
  WEBHOOKS_TABLE_DEFAULT_PK_KEY,
  WEBHOOKS_TABLE_DEFAULT_SORT_KEY,
  WEBHOOKS_TABLE_NAME,
  WEBHOOKS_TABLE_SECONDARY_INDEX_NAME,
  WEBHOOKS_TABLE_SECONDARY_SORT_KEY,
} from "@lib/constants";

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
    const parsed = searchForSecretsWrapper(__dirname);
    const webhooksTable = createDatabase({
      stack: this,
      tableName: WEBHOOKS_TABLE_NAME,
      pkName: WEBHOOKS_TABLE_DEFAULT_PK_KEY,
      sortKey: WEBHOOKS_TABLE_DEFAULT_SORT_KEY,
      secondaryIndex: {
        indexName: WEBHOOKS_TABLE_SECONDARY_INDEX_NAME,
        sortKey: {
          name: WEBHOOKS_TABLE_SECONDARY_SORT_KEY,
          type: dynamodb.AttributeType.NUMBER,
        },
      },
    });
    const tableData = {
      activeWebhooks: {
        id: WEBHOOKS_TABLE_NAME,
        name: webhooksTable.tableName,
        arn: webhooksTable.tableArn,
      },
    };

    this.createAPI = (restApiDomainName, s3MediaBucket) => {
      api = createApi(
        this,
        webhooksApiMap({
          webhooksAPIDomainName: WEBHOOKS_DOMAIN_NAME,
          restApiDomainName: restApiDomainName,
          s3MediaBucket: s3MediaBucket,
          tableData: tableData,
          stack: this,
        }),
        WEBHOOKS_API_GATEWAY_NAME
      );
      const plan = api.addUsagePlan(WEBHOOKS_API_GATEWAY_USAGE_PLAN, {
        name: WEBHOOKS_API_GATEWAY_USAGE_PLAN,
        throttle: {
          rateLimit: 200,
          burstLimit: 30,
        },
      });
      //add api key
      const key = api.addApiKey(WEBHOOKS_API_GATEWAY_KEY_NAME, {
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
        id: GOOGLE_DRIVE_WATCH_CRON_JOB_NAME,
        path: "/watch/googleDriveChannel",
      });
      const githubWatchChannelCron = createApiGatewayCronJob({
        ...cronProps,
        id: GITHUB_WATCH_CRON_JOB_NAME,
        path: "/watch/githubChannel",
      });
      return api;
    };
    this.createCertificate = (hostedZone) => {
      const webhookDomainNames = {
        [WEBHOOKS_DOMAIN_NAME]: hostedZone,
      };
      const certificate = createCertificate({
        stack: this,
        certName: WEBHOOKS_API_GATEWAY_CERTIFICATE_NAME,
        primaryDomainName: WEBHOOKS_DOMAIN_NAME,
        domainValidations: webhookDomainNames,
      });
      return certificate;
    };
    this.mapAPIToHostedZone = (zone, certificate) => {
      if (!api) return null;
      api.addDomainName(WEBHOOKS_DOMAIN_API_GATEWAY_NAME, {
        domainName: WEBHOOKS_DOMAIN_NAME,
        certificate: certificate,
      });
      const record = createAliasRecord({
        stack: this,
        zone: zone,
        id: WEBHOOKS_DOMAIN_NAME_ALIAS_RECORD_NAME,
        aliasTarget: new targets.ApiGateway(api),
        recordName: WEBHOOKS_DOMAIN_NAME,
      });
      return [record, api];
    };
  }
}
