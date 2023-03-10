import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { postTemplate } from "../../../../../../utils/apiTemplates/postTemplate";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
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
  const document: Record<string, AttributeValue | null> = {
    name: name,
    description: description,
    src: src,
    placeholderSrc: placeholderSrc,
    height: height,
    width: width,
  };
  return marshall(document, {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      });
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  return await postTemplate({
    e,
    callback: createDocument,
    successMessage: "Updated hobbies document in hobbies table",
    tableName: convertToStr(process.env.AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME),
  });
}
