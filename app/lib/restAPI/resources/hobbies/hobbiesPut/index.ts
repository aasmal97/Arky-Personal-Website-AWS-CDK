import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuid } from "uuid";
import {
  putTemplate,
  isString,
} from "../../../../utils/apiTemplates/putTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
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
  const currDate = new Date().toISOString();
  const document = {
    pk: {
      orientation: width / height >= 1 ? "horizontal" : "vertical",
      dateCreated: currDate,
    },
    recordType: "hobbies",
    id: uuid(),
    name: name,
    description: description,
    src: src,
    placeholderSrc: placeholderSrc,
    height: height,
    width: width,
    dateCreated: currDate,
    orientation: width / height >= 1 ? "horizontal" : "vertical",
  };
  return marshall(document);
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
