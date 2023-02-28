import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { postTemplate } from "../../../../../../utils/apiTemplates/postTemplate";
import { convertToAttr } from "@aws-sdk/util-dynamodb";

const convertToAttributeStr = (s: any) => {
  if (typeof s !== "string") return null;
  return convertToAttr(s);
};
const convertToAttributeArr = (arr: any) => {
  if (!Array.isArray(arr)) return null;
  return convertToAttr(arr);
};
const createDocument = (e: APIGatewayEvent) => {
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
    topics,
  } = JSON.parse(e.body);
  const document: Record<string, AttributeValue | null> = {
    imgDescription: convertToAttributeStr(imgDescription),
    appURL: convertToAttributeStr(appURL),
    imgURL: convertToAttributeStr(src),
    placeholderURL: convertToAttributeStr(placeholderSrc),
    projectName: convertToAttributeStr(projectName),
    githubURL: convertToAttributeStr(githubURL),
    description: convertToAttributeStr(description),
    startDate: convertToAttributeStr(startDate),
    endDate: convertToAttributeStr(endDate),
    topics: convertToAttributeArr(topics),
  };
  return document;
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  return await postTemplate({
    e,
    callback: createDocument,
    tableName: "projects",
    successMessage: "Updated projects document",
  });
}
