import { Stack } from "aws-cdk-lib";
import { IAliasRecordTarget, IHostedZone } from "aws-cdk-lib/aws-route53";
import * as route53 from "aws-cdk-lib/aws-route53";
export const createAliasRecord = ({
  stack,
  zone,
  aliasTarget,
  id,
  recordName
}: {
  zone: IHostedZone;
  aliasTarget: IAliasRecordTarget;
  stack: Stack;
  id: string;
  recordName: string;
}) => {
  return new route53.ARecord(stack, id, {
    recordName: recordName,
    zone: zone,
    target: route53.RecordTarget.fromAlias(aliasTarget),
  });
};
export const createCnameRecord = ({
  stack,
  zone,
  recordName,
  domainName,
  id,
}: {
  zone: IHostedZone;
  recordName: string;
  stack: Stack;
  id: string;
  domainName: string;
}) => {
  return new route53.CnameRecord(stack, id, {
    recordName: recordName,
    zone: zone,
    domainName: domainName,
  });
};
