import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
export const createDatabase = ({
  stack,
  tableName,
  pkName,
  sortKey,
  secondaryIndex,
  addedId,
}: {
  addedId?: string;
  sortKey: string;
  stack: cdk.Stack;
  tableName: string;
  pkName: string;
  secondaryIndex?: cdk.aws_dynamodb.LocalSecondaryIndexProps;
}) => {
  const id = `${tableName}${addedId ? addedId : ""}`;
  const table = new dynamodb.Table(stack, id, {
    partitionKey: {
      name: pkName,
      type: dynamodb.AttributeType.STRING,
    },
    sortKey: {
      name: sortKey,
      type: dynamodb.AttributeType.STRING,
    },
    replicationRegions: ["us-east-1"],
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    tableClass: dynamodb.TableClass.STANDARD,
  });
  if (secondaryIndex)
    table.addLocalSecondaryIndex({
      ...secondaryIndex,
    });
  return table;
};
