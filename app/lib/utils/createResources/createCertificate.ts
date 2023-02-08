import { Stack } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { IHostedZone } from "aws-cdk-lib/aws-route53";

export const createCertificate = ({
  stack,
  certName,
  primaryDomainName,
  domainValidations,
}: {
  stack: Stack;
  certName: string;
  primaryDomainName: string;
  domainValidations: { [key: string]: IHostedZone };
}) => {
  const dnsValidation: {
    [key: string]: IHostedZone;
  } = {
    ...domainValidations,
  };
  const entries = Object.entries(domainValidations).map(([key, value]) => key);
  const filterDomainName = entries.filter((e) => e !== primaryDomainName);
  const myCertificate = new acm.Certificate(stack, certName, {
    domainName: primaryDomainName,
    subjectAlternativeNames: filterDomainName,
    validation: acm.CertificateValidation.fromDnsMultiZone(dnsValidation),
  });
  return myCertificate;
};
