import { Stack } from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
export const createHostedZone = ({
    zoneName,
    domainName, 
    stack
}:{
    domainName: string,
    stack: Stack,
    zoneName: string, 
}) => {
  return new route53.HostedZone(stack, zoneName, {
    zoneName: domainName,
  });
};
