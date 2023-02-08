import { aws_iam, Stack } from "aws-cdk-lib";
export function filterEntries(
  argument: [string, aws_iam.PolicyDocument | null]
): argument is [string, aws_iam.PolicyDocument] {
  const [key, value] = argument;
  return !!value;
}
export const createLambdaRole = (
  key: string,
  policies?: {
    [name: string]: aws_iam.PolicyDocument | null;
  },
  stack?: Stack
) => {
  if (!stack || !policies) return undefined;
  const map: {
    [name: string]: aws_iam.PolicyDocument;
  } = {};
  const entries = Object.entries(policies).filter(filterEntries);
  entries.forEach(([key, value]) => (map[key] = value));
  return new aws_iam.Role(stack, key, {
    assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    inlinePolicies: map,
  });
};
