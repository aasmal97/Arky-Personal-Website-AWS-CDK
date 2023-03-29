import { aws_iam } from "aws-cdk-lib";

export const createDynamoPolicy = (
  actionType: "GET" | "PUT" | "DELETE" | "POST",
  table: {
    id?: string;
    arn?: string;
  }
): aws_iam.PolicyDocument => {
  const getActions = [
    "dynamodb:BatchGet*",
    "dynamodb:Get*",
    "dynamodb:Query*",
    "dynamodb:Scan*",
  ];
  const putActions = ["dynamodb:PutItem"];
  const deleteActions = ["dynamodb:Delete*"];
  const updateActions = ["dynamodb:BatchWrite*", "dynamodb:Update*"];
  let actions: string[] = [];
  switch (actionType) {
    case "DELETE":
      actions = deleteActions;
      break;
    case "GET":
      actions = getActions;
      break;
    case "POST":
      actions = updateActions;
      break;
    case "PUT":
      actions = putActions;
      break;
  }
  const sid = `${table.id}${actionType}1`;
  return new aws_iam.PolicyDocument({
    statements: [
      new aws_iam.PolicyStatement({
        sid: sid,
        effect: aws_iam.Effect.ALLOW,
        actions: [...actions],
        resources: table.arn
          ? [table.arn, `${table.arn}/index`, `${table.arn}/*`]
          : [],
      }),
    ],
  });
};
