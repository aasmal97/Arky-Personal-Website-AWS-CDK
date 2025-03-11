import { aws_cloudfront, Stack } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Bucket } from "aws-cdk-lib/aws-s3";
// import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  S3BucketOrigin,
  S3StaticWebsiteOrigin,
} from "aws-cdk-lib/aws-cloudfront-origins";
export const createCloudfrontDist = ({
  stack,
  name,
  bucket,
  certificate,
  domainNames,
  isWebsite,
}: {
  domainNames: string[];
  stack: Stack;
  name: string;
  bucket: Bucket;
  certificate: ICertificate;
  isWebsite?: {
    rootObjPath: string;
    redirectFunc?: aws_cloudfront.Function;
  };
}) => {
  const functionAssociations: aws_cloudfront.FunctionAssociation[] | undefined =
    isWebsite
      ? isWebsite.redirectFunc
        ? [
            {
              function: isWebsite.redirectFunc,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ]
        : undefined
      : undefined;
  const distribution = new cloudfront.Distribution(stack, name, {
    domainNames: domainNames,
    certificate: certificate,
    defaultRootObject: isWebsite?.rootObjPath,
    defaultBehavior: {
      origin: isWebsite
        ? new S3StaticWebsiteOrigin(bucket)
        : S3BucketOrigin.withOriginAccessControl(bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      functionAssociations: functionAssociations,
    },
  });
  
  return distribution;
}; 