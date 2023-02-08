import { Stack } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

const createS3Bucket = (stack: Stack, name: string) => {
  const bucket = new s3.Bucket(stack, name, {
    publicReadAccess: true,
    bucketName: name,
  });
  return bucket;
};
export default createS3Bucket;
