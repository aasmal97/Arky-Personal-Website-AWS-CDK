import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}
export const isString = (e: any): e is string => {
  return typeof e === "string";
};
export const convertToAttributeStr = (s: any) => ({
  S: typeof s === "string" ? s : "",
});
export const convertToAttributeNum = (n: number) => ({
  N: n.toString(),
});
export async function putTemplate({
  e,
  callback,
  tableName,
  successMessage,
}: {
  e: APIGatewayEvent;
  callback: (
    e: APIGatewayEvent
  ) => Record<string, AttributeValue> | APIGatewayProxyResult;
  tableName: string;
  successMessage: string;
}): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "PUT")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid response body",
    };

  const document = callback(e);
  if (isAPIGatewayResult(document)) return document;
  try {
    const params: PutItemCommandInput = {
      TableName: tableName,
      Item: document,
    };
    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const command = new PutItemCommand(params);
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
}
