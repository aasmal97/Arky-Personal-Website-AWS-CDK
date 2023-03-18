import { aws_iam } from "aws-cdk-lib";
import { camelCase } from "lodash";
export const createS3BucketPolicy = (
  actionType: "GET" | "PUT" | "DELETE",
  bucket: {
    id?: string;
    arn?: string;
  }
): aws_iam.PolicyDocument => {
  const getActions = [
    "s3:GetObject",
    "s3:GetObjectAttributes",
    "s3:GetObjectTagging",
    "s3:GetObjectVersion",
  ];
  const putActions = [
    "s3:PutObject",
    "s3:PutObjectTagging",
    "s3:PutObjectVersionTagging",
  ];
  const deleteActions = [
    "s3:DeleteObject",
    "s3:DeleteObjectTagging",
    "s3:DeleteObjectVersionTagging",
    "s3:DeleteObjectVersion",
  ];
  let actions: string[] = [];
  switch (actionType) {
    case "DELETE":
      actions = deleteActions;
      break;
    case "GET":
      actions = getActions;
      break;
    case "PUT":
      actions = putActions;
      break;
  }
  const sid = `${camelCase(bucket.id)}${actionType}`;
  return new aws_iam.PolicyDocument({
    statements: [
      new aws_iam.PolicyStatement({
        sid: sid,
        effect: aws_iam.Effect.ALLOW,
        actions: [...actions],
        resources: bucket.arn ? [bucket.arn] : [],
      }),
    ],
  });
};
