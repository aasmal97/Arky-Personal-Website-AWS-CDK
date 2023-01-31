import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  DeleteItemCommand,
  DeleteItemCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
const convertToAttributeStr = (s: any) => ({
  S: typeof s === "string" ? s : "",
});
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "DELETE")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const params = e.queryStringParameters;
  if (!params)
    return {
      statusCode: 400,
      body: "You must provide the id of the resource you want to delete",
    };
  const { id } = params;
  if (!id)
    return {
      statusCode: 400,
      body: "You must provide the id of the resource you want to delete",
    };
  const document: Record<string, AttributeValue> = {
    id: convertToAttributeStr(id),
  };
  try {
    const params: DeleteItemCommandInput = {
      TableName: "hobbies",
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
        message: "deleted user image in hobbies",
        document: document,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
}
