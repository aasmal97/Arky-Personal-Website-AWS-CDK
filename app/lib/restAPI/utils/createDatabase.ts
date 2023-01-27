import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
export const createDatabase = ({
  stack,
  tableName,
  pkName,
}: {
  stack: cdk.Stack;
  tableName: string;
  pkName: string;
}) => {
  const table = new dynamodb.Table(stack, tableName, {
    partitionKey: {
      name: "id",
      type: dynamodb.AttributeType.STRING,
    },
    replicationRegions: ["us-east-1"],
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    tableClass: dynamodb.TableClass.STANDARD,
  });
  return table;
};
