import * as cdk from "aws-cdk-lib";
import createS3Bucket from "../createResources/createS3Bucket";
import { createCloudfrontDist } from "../createResources/createCloudfrontDist";
import { Stack } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
export const mapS3AndCloudfront = ({
  stack,
  bucketName,
  domainNames,
  certificate,
  isWebsite,
}: {
  stack: Stack;
  bucketName: string;
  domainNames: string[];
  certificate: ICertificate;
  isWebsite?: {
    rootObjPath: string;
    redirectFunc?: cdk.aws_cloudfront.Function;
    // errorDocPath?: string;
  };
}): [cdk.aws_s3.Bucket, cdk.aws_cloudfront.Distribution] => {
  const s3Bucket = createS3Bucket(stack, `${bucketName}-bucket`, isWebsite);
  const cloudfrontDist = createCloudfrontDist({
    stack: stack,
    name: `${bucketName}-distribution`,
    bucket: s3Bucket,
    domainNames: domainNames,
    certificate: certificate,
    isWebsite: isWebsite,
  });
  return [s3Bucket, cloudfrontDist];
};
