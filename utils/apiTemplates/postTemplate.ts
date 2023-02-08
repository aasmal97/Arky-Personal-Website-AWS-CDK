import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}
export const convertToAttributeStr = (s: any) => {
  if (!s) return null;
  if (!(typeof s === "string")) return null;
  return {
    S: s,
  };
};
function filterEntries(
  argument: [string, AttributeValue | null]
): argument is [string, AttributeValue] {
  const [key, value] = argument;
  return !!value;
}
const filterNullValues = (doc: Record<string, AttributeValue | null>) => {
  const filteredDoc: Record<string, AttributeValue> = {};
  const filteredDocArr = Object.entries(doc).filter(filterEntries);
  filteredDocArr.forEach(([key, value]) => (filteredDoc[key] = value));
  return filteredDoc;
};
const generateUpdateExpression = (
  e: Record<string, AttributeValue>
): [string, Record<string, AttributeValue>] => {
  let expression = `set `;
  const attributeValues: Record<string, AttributeValue> = {};
  Object.entries(e).forEach(([key, value]) => {
    const valueExp = `:${key}Value`;
    expression += `${key} = ${valueExp},`;
    attributeValues[valueExp] = value;
  });
  return [expression, attributeValues];
};

export async function postTemplate({
  e,
  callback,
  tableName,
  successMessage,
}: {
  e: APIGatewayEvent;
  callback: (
    e: APIGatewayEvent
  ) => Record<string, AttributeValue | null> | APIGatewayProxyResult;
  tableName: string;
  successMessage: string;
}): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "POST")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid response body",
    };
  const { key } = JSON.parse(e.body);
  const document = callback(e);
  if (isAPIGatewayResult(document)) return document;
  const filteredDoc = filterNullValues(document);
  const [updateExp, expAttr] = generateUpdateExpression(filteredDoc);
  try {
    const params: UpdateItemCommandInput = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExp,
      ExpressionAttributeValues: expAttr,
      ReturnValues: "UPDATED_NEW",
    };
    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const command = new UpdateItemCommand(params);
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
