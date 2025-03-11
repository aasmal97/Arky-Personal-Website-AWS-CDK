#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RestAPIStack } from "@restAPI/restAPIStack";
import { WebhooksStack } from "@webhooks/webhooksStack";
import { HostingStack } from "@lib/hosting/hostingStack";
const app = new cdk.App();
const hostingStack = new HostingStack(app, "HostingStack");
const restAPIStack = new RestAPIStack(app, "RestApiStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
//resources that need to accessed by other stacks
const hostingZone = hostingStack.getHostedZone();
const s3MediaBucket = hostingStack.getImgBucket();
const certificate = hostingStack.getCertificate();
//create rest api
restAPIStack.createAPI(hostingStack);
const mapResult = restAPIStack.mapAPIToHostedZone(hostingZone, certificate);

const webhooksStack = new WebhooksStack(app, "WebhooksStack", {});
//create webhooks api
const webhooksCertificate = webhooksStack.createCertificate(hostingZone);
const s3MediaBucketData = {
  id: s3MediaBucket.bucketName,
  name: s3MediaBucket.bucketName,
  arn: s3MediaBucket.bucketArn,
};
webhooksStack.createAPI(
  mapResult ? mapResult[0].domainName : undefined,
  s3MediaBucketData
);
webhooksStack.mapAPIToHostedZone(hostingZone, webhooksCertificate);
app.synth();
