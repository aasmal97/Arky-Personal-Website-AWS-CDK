import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createAliasRecord } from "../../../utils/createResources/createRecords";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { createApi } from "../../../utils/createResources/createApiTree";
import webhooksAPIMap from "./webhooksAPIMap";
import { createCertificate } from "../../../utils/createResources/createCertificate";

export class WebhooksStack extends cdk.Stack {
  createCertificate: (
    hostingZone: cdk.aws_route53.IHostedZone
  ) => cdk.aws_certificatemanager.Certificate;
  mapAPIToHostedZone: (
    hostingZone: cdk.aws_route53.IHostedZone,
    certificate: cdk.aws_certificatemanager.Certificate
  ) => [cdk.aws_route53.ARecord, cdk.aws_apigateway.RestApi] | null;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const api = createApi(this, webhooksAPIMap({}));
    const plan = api.addUsagePlan("webhooksUsagePlan", {
      name: "webhooksEasyPlan",
      throttle: {
        rateLimit: 20,
        burstLimit: 3,
      },
    });
    this.createCertificate = (hostedZone) => {
      const webhookDomainNames = {
        "webhooks.api.arkyasmal.com": hostedZone,
      };
      const certificate = createCertificate({
        stack: this,
        certName: "webhooksCertificate",
        primaryDomainName: "webhooks.api.arkyasmal.com",
        domainValidations: webhookDomainNames,
      });
      return certificate;
    };
    this.mapAPIToHostedZone = (zone, certificate) => {
      if (!api) return null;
      api.addDomainName("webhooksAPIDefaultDomainName", {
        domainName: "webhooks.api.arkyasmal.com",
        certificate: certificate,
      });
      const record = createAliasRecord({
        stack: this,
        zone: zone,
        id: "webhooksAPIARecord",
        aliasTarget: new targets.ApiGateway(api),
        recordName: "webhooks.api.arkyasmal.com",
      });
      return [record, api];
    };
  }
}
