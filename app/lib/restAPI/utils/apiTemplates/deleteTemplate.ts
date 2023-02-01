import {
  DynamoDBClient,
  DeleteItemCommand,
  DeleteItemCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
export const deleteTemplate = async ({
  tableName,
  document,
  successMessage,
}: {
  successMessage: string;
  tableName: string;
  document: Record<string, AttributeValue>;
}) => {
  try {
    const params: DeleteItemCommandInput = {
      TableName: tableName,
      Key: document,
    };
    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const command = new DeleteItemCommand(params);
    await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: successMessage,
        document: document,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
};
