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
export const dynamoPutDocument = async ({
  tableName,
  document,
  successMessage,
}: {
  tableName: string;
  document: Record<string, AttributeValue>;
  successMessage: string;
}) => {
  try {
    const params: PutItemCommandInput = {
      TableName: tableName,
      Item: document,
    };
    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const command = new PutItemCommand(params);
    const dynamoResult = await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: successMessage,
        document: document,
        dynamoResult: dynamoResult,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Bad Request",
        error: e,
      }),
    };
  }
};
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
  return await dynamoPutDocument({
    tableName,
    document,
    successMessage,
  });
}
