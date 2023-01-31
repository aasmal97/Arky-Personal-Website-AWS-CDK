import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import {
  putTemplate,
  isString,
  convertToAttributeStr,
  convertToAttributeNum,
} from "../../../utils/apiTemplates/putTemplate";
const createDocument = (e: APIGatewayEvent) => {
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid response body",
    };

  const { name, description, src, placeholderSrc, height, width } = JSON.parse(
    e.body
  );
  if (!name || !description || !src || !height || !width)
    return {
      statusCode: 400,
      body: "You must provide a name, description, src, placeholderSrc, height, and width attribute",
    };
  if (
    !isString(name) ||
    !isString(description) ||
    !isString(src) ||
    (placeholderSrc && !isString(placeholderSrc))
  )
    return {
      statusCode: 400,
      body: "Invalid types assigned to either name, description, src or placeholderSrc",
    };
  const document: Record<string, AttributeValue> = {
    id: convertToAttributeStr(uuid()),
    name: convertToAttributeStr(name),
    description: convertToAttributeStr(description),
    src: convertToAttributeStr(src),
    placeholderSrc: convertToAttributeStr(placeholderSrc),
    height: convertToAttributeNum(height),
    width: convertToAttributeNum(width),
  };
  return document;
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  return await putTemplate({
    e,
    callback: createDocument,
    tableName: "hobbies",
    successMessage: "Added hobby document to hobbies table",
  });
}
