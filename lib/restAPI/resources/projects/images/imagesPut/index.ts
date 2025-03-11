import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
import { Image } from "../../../utils/types/projectTypes";
import { convertToStr } from "@utils/general/convertToStr";
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
  const body: Partial<Image> = JSON.parse(e.body);
  const {
    imgDescription,
    imgURL,
    placeholderURL,
    documentId,
    width,
    height,
    googleResourceId,
    name,
  } = body;
  if (!documentId || !googleResourceId || !imgURL)
    return {
      statusCode: 400,
      body: "You must provide an img url and a document id",
    };
  if (!imgDescription)
    return {
      statusCode: 400,
      body: "You must provide a valid image description",
    };
  const newWidth = typeof width === "string" ? parseFloat(width) : width;
  const newHeight = typeof height === "string" ? parseFloat(height) : height;
  if (
    (newWidth && typeof newWidth !== "number") ||
    (newHeight && typeof newHeight !== "number")
  )
    return {
      statusCode: 400,
      body: "Invalid types assigned to width and height. Ensure they are integers or float types",
    };
  const document: Image = {
    pk: {
      googleResourceId,
      documentId,
    },
    name,
    imgURL,
    documentId,
    imgDescription,
    id: uuid(),
    placeholderURL,
    width: newWidth,
    height: newHeight,
    googleResourceId,
  };
  try {
    const params: PutItemCommandInput = {
      TableName: convertToStr(
        process.env.AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME
      ),
      Item: marshall(document, {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }),
    };
    const client = new DynamoDBClient({
      region: "us-east-1",
    });
    const command = new PutItemCommand(params);
    await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Added project image document to project image table",
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
