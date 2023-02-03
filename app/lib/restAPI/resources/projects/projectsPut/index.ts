import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
const isString = (e: any): e is string => {
  return typeof e === "string";
};
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
  const currDate = new Date().toISOString();
  const document = {
    pk: {
      recordType: "projects",
      startDate: currDate,
    },
    recordType: "projects",
    id: uuid(),
    imgDescription: imgDescription,
    appURL: appURL,
    imgURL: src,
    placeholderURL: placeholderSrc,
    projectName: projectName,
    githubURL: githubURL,
    description: description,
    startDate: startDate,
    endDate: endDate,
    dateCreated: currDate,
  };
  try {
    const params: PutItemCommandInput = {
      TableName: "projects",
      Item: marshall(document),
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
