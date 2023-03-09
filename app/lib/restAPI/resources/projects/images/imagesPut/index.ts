import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
import { Image } from "../../../types/projectTypes";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
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
  const { imgDescription, imgURL, placeholderURL, documentId } = body;
  if (!documentId || !imgURL)
    return {
      statusCode: 400,
      body: "You must provide an img url and a document id",
    };
  if (!imgDescription)
    return {
      statusCode: 400,
      body: "You must provide a valid image description",
    };
  const document: Image = {
    pk: {
      imgURL,
      documentId,
    },
    imgURL,
    documentId,
    imgDescription,
    id: uuid(),
    placeholderURL,
  };
  try {
    const params: PutItemCommandInput = {
      TableName: convertToStr(
        process.env.AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME
      ),
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
        message: "Added project image document to project image table",
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
