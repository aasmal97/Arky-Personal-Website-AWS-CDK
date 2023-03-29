import * as iam from "aws-cdk-lib/aws-iam";
export const createStateMachinePolicy = ({
  stateMachineArn,
}: {
  stateMachineArn: string;
}) => {
  const stateMachinePolicy = new iam.PolicyDocument({
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:ListStateMachines", "states:StartExecution"],
        resources: [stateMachineArn],
      }),
    ],
  });
  return stateMachinePolicy;
};
