import * as cdk from "aws-cdk-lib";
import webhooksApiMap from "./webhooksApiMap";
import { Construct } from "constructs";
import { createAliasRecord } from "../../../utils/createResources/createRecords";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { createApi } from "../../../utils/createResources/createApiTree";
import { createCertificate } from "../../../utils/createResources/createCertificate";

export class WebhooksStack extends cdk.Stack {
  createCertificate: (
    hostingZone: cdk.aws_route53.IHostedZone
  ) => cdk.aws_certificatemanager.Certificate;
  mapAPIToHostedZone: (
    hostingZone: cdk.aws_route53.IHostedZone,
    certificate: cdk.aws_certificatemanager.Certificate
  ) => [cdk.aws_route53.ARecord, cdk.aws_apigateway.RestApi] | null;
  createAPI: () => cdk.aws_apigateway.RestApi;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    let api: cdk.aws_apigateway.RestApi | undefined;
    const webhooksAPIDomainName = "webhooks.api.arkyasmal.com"
    
    this.createAPI = () => {
      api = createApi(this, webhooksApiMap({
        webhooksAPIDomainName: webhooksAPIDomainName
      }), "webhooks-api");
      const plan = api.addUsagePlan("webhooksUsagePlan", {
        name: "webhooksEasyPlan",
        throttle: {
          rateLimit: 20,
          burstLimit: 3,
        },
      });
      return api
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
