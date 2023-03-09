import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { ProjectDocument } from "../../types/projectTypes";
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
    images,
    appURL,
    githubURL,
    startDate,
    endDate,
    topics,
  } = JSON.parse(e.body);
  if (!projectName)
    return {
      statusCode: 400,
      body: "You must provide a projectName",
    };
  if (!isString(projectName))
    return {
      statusCode: 400,
      body: "Invalid types assigned to name",
    };
  const currDate = new Date().toISOString();
  const document: ProjectDocument = {
    pk: {
      recordType: "projects",
      dateCreated: currDate,
    },
    recordType: "projects",
    id: uuid(),
    appURL: convertToStr(appURL),
    images: images,
    projectName: projectName,
    githubURL: convertToStr(githubURL),
    description: convertToStr(description),
    startDate: convertToStr(startDate),
    endDate: convertToStr(endDate),
    dateCreated: currDate,
    topics: Array.isArray(topics) ? topics : [],
    archived: false,
  };
  try {
    const params: PutItemCommandInput = {
      TableName: convertToStr(process.env.AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME),
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
