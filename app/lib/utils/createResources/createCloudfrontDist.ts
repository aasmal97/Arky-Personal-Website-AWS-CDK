import { Stack } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Bucket } from "aws-cdk-lib/aws-s3";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
export const createCloudfrontDist = ({
  stack,
  name,
  bucket,
  certificate,
  domainNames,
}: {
  domainNames: string[];
  stack: Stack;
  name: string;
  bucket: Bucket;
  certificate: ICertificate;
}) => {
  const distribution = new cloudfront.Distribution(stack, name, {
    domainNames: domainNames,
    certificate: certificate,
    defaultBehavior: {
      origin: new origins.S3Origin(bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    },
  });
  return distribution;
};
