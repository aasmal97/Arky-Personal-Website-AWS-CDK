import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}

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
  //remove last comma
  const newExpression = expression.substring(0, expression.length - 1);
  return [newExpression, attributeValues];
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
  ) => Record<string, AttributeValue> | APIGatewayProxyResult;
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
  const [updateExp, expAttr] = generateUpdateExpression(document);
  try {
    const params: UpdateItemCommandInput = {
      TableName: tableName,
      Key: marshall(key, {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }),
      UpdateExpression: updateExp,
      ExpressionAttributeValues: expAttr,
      ReturnValues: "UPDATED_NEW",
    };

    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const command = new UpdateItemCommand(params);
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
}
