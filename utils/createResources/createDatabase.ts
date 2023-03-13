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
  sortKey:
    | string
    | {
        name: string;
        type: cdk.aws_dynamodb.AttributeType;
      };
  stack: cdk.Stack;
  tableName: string;
  pkName:
    | string
    | {
        name: string;
        type: cdk.aws_dynamodb.AttributeType;
      };
  secondaryIndex?: cdk.aws_dynamodb.LocalSecondaryIndexProps;
}) => {
  const id = `${tableName}${addedId ? addedId : ""}`;
  const table = new dynamodb.Table(stack, id, {
    partitionKey:
      typeof pkName === "string"
        ? {
            name: pkName,
            type: dynamodb.AttributeType.STRING,
          }
        : pkName,
    sortKey:
      typeof sortKey === "string"
        ? {
            name: sortKey,
            type: dynamodb.AttributeType.STRING,
          }
        : sortKey,
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
