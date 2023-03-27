import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuid } from "uuid";
import {
  putTemplate,
  isString,
} from "../../../../../../utils/apiTemplates/putTemplate";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { marshall } from "@aws-sdk/util-dynamodb";
export type HobbiesDocument = {
  pk: {
    orientation: string;
    dateCreated: string;
  };
  recordType: string;
  id: string;
  name: string;
  imgDescription: string;
  imgURL: string;
  googleResourceId: string;
  placeholderURL: any;
  width: number;
  height: number;
  dateCreated: string;
  orientation: string;
};
const createDocument = (e: APIGatewayEvent) => {
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid response body",
    };

  const {
    name,
    imgDescription,
    imgURL,
    placeholderURL,
    height,
    width,
    googleResourceId,
  } = JSON.parse(e.body);
  if (
    !name ||
    !imgDescription ||
    !googleResourceId ||
    !imgURL ||
    !height ||
    !width
  )
    return {
      statusCode: 400,
      body: "You must provide a name, imgDescription, imgURL, placeholderURL, height, and width attribute",
    };
  if (
    !isString(googleResourceId) ||
    !isString(name) ||
    !isString(imgDescription) ||
    !isString(imgURL) ||
    (placeholderURL && !isString(placeholderURL))
  )
    return {
      statusCode: 400,
      body: "Invalid types assigned to either name, imgDescription, imgURL or placeholderURL",
    };
  const currDate = new Date().toISOString();
  const newWidth = typeof width === "string" ? parseFloat(width) : width;
  const newHeight = typeof height === "string" ? parseFloat(height) : height;
  if (typeof newWidth !== "number" || typeof newHeight !== "number")
    return {
      statusCode: 400,
      body: "Invalid types assigned to width and height. Ensure they are integers or float types",
    };
  const document = {
    pk: {
      orientation: width / height >= 1 ? "horizontal" : "vertical",
      dateCreated: currDate,
    },
    recordType: "hobbies",
    id: uuid(),
    name: name,
    imgDescription: imgDescription,
    imgURL: imgURL,
    googleResourceId: googleResourceId,
    placeholderURL: placeholderURL,
    width: newWidth,
    height: newHeight,
    dateCreated: currDate,
    orientation: newWidth / newHeight >= 1 ? "horizontal" : "vertical",
  };
  return marshall(document, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  return await putTemplate({
    e,
    callback: createDocument,
    tableName: convertToStr(process.env.AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME),
    successMessage: "Added hobby document to hobbies table",
  });
}
