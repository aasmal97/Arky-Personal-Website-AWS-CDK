import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { postTemplate } from "../../../../utils/apiTemplates/postTemplate";
const convertToAttributeStr = (s: any) => {
  if (!s) return null;
  if (!(typeof s === "string")) return null;
  return {
    S: s,
  };
};
const convertToAttributeNum = (n: number) => {
  if (!(typeof n === "number")) return null;
  return {
    N: n.toString(),
  };
};
const createDocument = (e: APIGatewayEvent) => {
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid response body",
    };

  const { name, description, src, placeholderSrc, height, width } = JSON.parse(
    e.body
  );
  const document: Record<string, AttributeValue | null> = {
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
  return await postTemplate({
    e,
    callback: createDocument,
    successMessage: "Updated hobbies document in hobbies table",
    tableName: "hobbies",
  });
}
