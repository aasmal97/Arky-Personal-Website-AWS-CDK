import { Stack } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

const createS3Bucket = (
  stack: Stack,
  name: string,
  isWebsite?: {
    rootObjPath: string;
    errorDocPath?: string;
  }
) => {
  let addProps: s3.BucketProps = {
    websiteErrorDocument: isWebsite? isWebsite.errorDocPath: undefined,
    websiteIndexDocument: isWebsite ? isWebsite.rootObjPath : undefined
  }

  const bucket = new s3.Bucket(stack, name, {
    publicReadAccess: true,
    bucketName: name,
    ...addProps
  });
  return bucket;
};
export default createS3Bucket;
