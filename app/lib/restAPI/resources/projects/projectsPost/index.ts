import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { postTemplate } from "../../../../../../utils/apiTemplates/postTemplate";

const convertToAttributeStr = (s: any) => {
  if (!s) return null;
  if (!(typeof s === "string")) return null;
  return {
    S: s,
  };
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
