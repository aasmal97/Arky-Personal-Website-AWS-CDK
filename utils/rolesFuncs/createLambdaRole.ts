import { aws_iam, Stack } from "aws-cdk-lib";
export function filterEntries(
  argument: [string, aws_iam.PolicyDocument | aws_iam.IManagedPolicy | null]
): argument is [string, aws_iam.PolicyDocument | aws_iam.IManagedPolicy] {
  const [key, value] = argument;
  return !!value;
}
export const createLambdaRole = (
  key: string,
  policies?: {
    [name: string]: aws_iam.PolicyDocument | aws_iam.IManagedPolicy | null;
  },
  stack?: Stack
) => {
  if (!stack || !policies) return undefined;
  const map: {
    [name: string]: aws_iam.PolicyDocument | aws_iam.IManagedPolicy;
  } = {};
  const inlinePoliciesMap: {
    [name: string]: aws_iam.PolicyDocument;
  } = {};
  const managedPoliciesArr: aws_iam.IManagedPolicy[] = [];
  const entries = Object.entries(policies).filter(filterEntries);
  entries.forEach(([key, value]) => {
    if (value instanceof aws_iam.PolicyDocument) map[key] = value;
    else managedPoliciesArr.push(value);
  });
  return new aws_iam.Role(stack, key, {
    assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    inlinePolicies: inlinePoliciesMap,
    managedPolicies: managedPoliciesArr,
  });
};
