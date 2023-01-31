import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
const isString = (e: any): e is string => {
  return typeof e === "string";
};
const convertToAttributeStr = (s: any) => ({
  S: typeof s === "string" ? s : "",
});
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
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
  const {
    projectName,
    description,
    imgDescription,
    src,
    placeholderSrc,
    appURL,
    githubURL,
    startDate,
    endDate,
  } = JSON.parse(e.body);
  if (!projectName || !description)
    return {
      statusCode: 400,
      body: "You must provide a projectName, and description attribute",
    };
  if (!isString(projectName) || !isString(description))
    return {
      statusCode: 400,
      body: "Invalid types assigned to either name, description",
    };

  const document: Record<string, AttributeValue> = {
    id: convertToAttributeStr(uuid()),
    imgDescription: convertToAttributeStr(imgDescription),
    appURL: convertToAttributeStr(appURL),
    imgURL: convertToAttributeStr(src),
    placeholderURL: convertToAttributeStr(placeholderSrc),
    projectName: convertToAttributeStr(projectName),
    githubURL: convertToAttributeStr(githubURL),
    description: convertToAttributeStr(description),
    startDate: convertToAttributeStr(startDate),
    endDate: convertToAttributeStr(endDate),
  };
  try {
    const params: PutItemCommandInput = {
      TableName: "projects",
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
        message: "Added project document to project table",
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
