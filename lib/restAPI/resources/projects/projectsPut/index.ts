import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
import { convertToStr } from "@utils/general/convertToStr";
import { ProjectDocument } from "../../utils/types/projectTypes";
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
    appURL,
    githubURL,
    startDate,
    endDate,
    topics,
    archived,
    repoOwner,
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
  if (!startDate)
    return {
      statusCode: 400,
      body: "You must provide a start date",
    };
  const newStartDate = new Date(startDate);
  if (isNaN(newStartDate.valueOf()))
    return {
      statusCode: 400,
      body: "Invalid Start Date",
    };
  const currDate = new Date().toISOString();
  const document: ProjectDocument = {
    pk: {
      recordType: "projects",
      dateCreated: currDate,
      startDate: newStartDate.toISOString(),
    },
    recordType: "projects",
    id: uuid(),
    appURL: appURL,
    projectName: projectName,
    githubURL: githubURL,
    description: description,
    startDate: newStartDate.toISOString(),
    endDate: endDate,
    dateCreated: currDate,
    topics: Array.isArray(topics) ? topics : [],
    archived: archived,
    repoOwner: repoOwner,
  };
  try {
    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const params: PutItemCommandInput = {
      TableName: convertToStr(process.env.AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME),
      Item: marshall(document, {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }),
    };
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
      body: JSON.stringify({
        message: "Bad Request",
        error: e,
      }),
    };
  }
}
