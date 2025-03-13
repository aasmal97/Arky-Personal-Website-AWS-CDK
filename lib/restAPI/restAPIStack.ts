import * as cdk from "aws-cdk-lib";
import { AttributeType, ProjectionType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import restAPIMap from "./restApiMap";
import { createApi } from "@utils/createResources/createApiTree";
import { createDatabase } from "@utils/createResources/createDatabase";
import { createAliasRecord } from "@utils/createResources/createRecords";
import { HostingStack } from "../hosting/hostingStack";
import { searchForSecretsWrapper } from "@utils/buildFuncs/searchForSecrets";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { createSkillCronJob } from "./resources/utils/createResources/createSkillCronJob";
import { createUserMetricCronJob } from "./resources/utils/createResources/createUserMetricsCronJob";
import {
  HOBBIES_DB_TABLE_NAME,
  PROJECTS_DB_TABLE_NAME,
  PROJECTS_IMAGES_DB_TABLE_NAME,
  REST_API_DOMAIN_NAME,
  REST_API_DOMAIN_NAME_ALIAS_RECORD_NAME,
  REST_API_DOMAIN_NAME_API_GATEWAY_NAME,
  REST_API_GATEWAY_NAME,
  REST_API_KEY_NAME,
  REST_API_USAGE_PLAN_NAME,
  HOBBIES_DB_DEFAULT_PK_KEY,
  HOBBIES_DB_DEFAULT_SORT_KEY,
  HOBBIES_DB_SECONDARY_INDEX_NAME,
  SKILLS_DB_TABLE_NAME,
  HOBBIES_DB_SECONDARY_SORT_KEY,
  PROJECTS_DB_DEFAULT_PK_KEY,
  PROJECTS_DB_DEFAULT_SORT_KEY,
  PROJECTS_DB_SECONDARY_INDEX_NAME,
  PROJECTS_DB_SECONDARY_SORT_KEY,
  SKILLS_DB_DEFAULT_PK_KEY,
  SKILLS_DB_DEFAULT_SORT_KEY,
  PROJECTS_IMAGES_DB_DEFAULT_PK_KEY,
  PROJECTS_IMAGES_DB_DEFAULT_SORT_KEY,
  METRIC_DB_TABLE_NAME,
  METRICS_DB_DEFAULT_PK_KEY,
  METRICS_DB_DEFAULT_SORT_KEY,
} from "@lib/constants";

export class RestAPIStack extends cdk.Stack {
  createAPI: (e: HostingStack) => cdk.aws_apigateway.RestApi;
  getRestApi: () => cdk.aws_apigateway.RestApi | undefined;
  mapAPIToHostedZone: (
    hostingZone: cdk.aws_route53.IHostedZone,
    certificate: cdk.aws_certificatemanager.Certificate
  ) => [cdk.aws_route53.ARecord, cdk.aws_apigateway.RestApi] | null;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const hobbiesDb = createDatabase({
      stack: this,
      tableName: HOBBIES_DB_TABLE_NAME,
      pkName: HOBBIES_DB_DEFAULT_PK_KEY,
      sortKey: HOBBIES_DB_DEFAULT_SORT_KEY,
      secondaryIndex: {
        indexName: HOBBIES_DB_SECONDARY_INDEX_NAME,
        sortKey: {
          name: HOBBIES_DB_SECONDARY_SORT_KEY,
          type: AttributeType.STRING,
        },
        projectionType: ProjectionType.ALL,
      },
    });
    const projectsDb = createDatabase({
      stack: this,
      tableName: PROJECTS_DB_TABLE_NAME,
      pkName: PROJECTS_DB_DEFAULT_PK_KEY,
      sortKey: PROJECTS_DB_DEFAULT_SORT_KEY,
      secondaryIndex: {
        indexName: PROJECTS_DB_SECONDARY_INDEX_NAME,
        sortKey: {
          name: PROJECTS_DB_SECONDARY_SORT_KEY,
          type: AttributeType.STRING,
        },
        projectionType: ProjectionType.ALL,
      },
    });

    const projectImagesDb = createDatabase({
      stack: this,
      tableName: PROJECTS_IMAGES_DB_TABLE_NAME,
      pkName: PROJECTS_IMAGES_DB_DEFAULT_PK_KEY,
      sortKey: PROJECTS_IMAGES_DB_DEFAULT_SORT_KEY,
    });
    const metricsDb = createDatabase({
      stack: this,
      tableName: METRIC_DB_TABLE_NAME,
      pkName: METRICS_DB_DEFAULT_PK_KEY,
      sortKey: METRICS_DB_DEFAULT_SORT_KEY,
    });
    const skillsDb = createDatabase({
      stack: this,
      tableName: SKILLS_DB_TABLE_NAME,
      pkName: SKILLS_DB_DEFAULT_PK_KEY,
      sortKey: SKILLS_DB_DEFAULT_SORT_KEY,
    });
    const skillsTableInfo = {
      name: skillsDb.tableName,
      id: SKILLS_DB_TABLE_NAME,
      arn: skillsDb.tableArn,
    };
    const metricTableInfo = {
      name: metricsDb.tableName,
      id: METRIC_DB_TABLE_NAME,
      arn: metricsDb.tableArn,
    };
    const tablesMap = {
      [HOBBIES_DB_TABLE_NAME]: {
        name: hobbiesDb.tableName,
        id: HOBBIES_DB_TABLE_NAME,
        arn: hobbiesDb.tableArn,
      },
      [PROJECTS_DB_TABLE_NAME]: {
        name: projectsDb.tableName,
        id: PROJECTS_DB_TABLE_NAME,
        arn: projectsDb.tableArn,
      },
      [PROJECTS_IMAGES_DB_TABLE_NAME]: {
        name: projectImagesDb.tableName,
        id: PROJECTS_IMAGES_DB_TABLE_NAME,
        arn: projectImagesDb.tableArn,
      },
      [SKILLS_DB_TABLE_NAME]: skillsTableInfo,
      [METRIC_DB_TABLE_NAME]: metricTableInfo,
    };
    let api: cdk.aws_apigateway.RestApi | undefined;
    const parsed = searchForSecretsWrapper(__dirname);
    createSkillCronJob({
      stack: this,
      skillsTableInfo,
      dirname: __dirname,
    });
    createUserMetricCronJob({
      stack: this,
      userMetricsTableInfo: metricTableInfo,
      dirname: __dirname,
    });

    this.getRestApi = () => api;
    this.createAPI = (hostingStack: HostingStack) => {
      api = createApi(
        this,
        restAPIMap({
          hostingStack,
          stack: this,
          tablesInfoMap: tablesMap,
          restApiDomainName: REST_API_DOMAIN_NAME,
        }),
        REST_API_GATEWAY_NAME
      );
      const plan = api.addUsagePlan(REST_API_USAGE_PLAN_NAME, {
        name: REST_API_USAGE_PLAN_NAME,
        throttle: {
          rateLimit: 200,
          burstLimit: 30,
        },
      });
      const key = api.addApiKey(REST_API_KEY_NAME, {
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
      api.addDomainName(REST_API_DOMAIN_NAME_API_GATEWAY_NAME, {
        domainName: REST_API_DOMAIN_NAME,
        certificate: certificate,
      });
      const record = createAliasRecord({
        stack: this,
        zone: zone,
        id: REST_API_DOMAIN_NAME_ALIAS_RECORD_NAME,
        aliasTarget: new targets.ApiGateway(api),
        recordName: REST_API_DOMAIN_NAME,
      });
      return [record, api];
    };
  }
}
