import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { postTemplate } from "../../../../../../utils/apiTemplates/postTemplate";
import { convertToAttr } from "@aws-sdk/util-dynamodb";
import { ProjectDocument } from "../../types/projectTypes";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
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
  const body: Partial<ProjectDocument> = JSON.parse(e.body);
  const {
    projectName,
    description,
    images,
    appURL,
    githubURL,
    startDate,
    endDate,
    topics,
    archived
  } = body ;
  const document: Record<string, AttributeValue | null> = {
    images: convertToAttributeArr(images),
    appURL: convertToAttributeStr(appURL),
    projectName: convertToAttributeStr(projectName),
    githubURL: convertToAttributeStr(githubURL),
    description: convertToAttributeStr(description),
    startDate: convertToAttributeStr(startDate),
    endDate: convertToAttributeStr(endDate),
    topics: convertToAttributeArr(topics),
    archived: convertToAttr(archived),
  };
  return document;
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  return await postTemplate({
    e,
    callback: createDocument,
    tableName: convertToStr(
        process.env.AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME
      ),
    successMessage: "Updated projects document",
  });
}
