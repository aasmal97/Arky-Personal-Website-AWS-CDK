import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { deleteTemplate } from "@utils/apiTemplates/deleteTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Image } from "@app/types";
import { convertToStr } from "@utils/general/convertToStr";
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "DELETE")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const params = e.queryStringParameters;
  if (!params)
    return {
      statusCode: 400,
      body: "You must provide the id of the resource you want to delete",
    };
  const { key } = params;
  if (!key)
    return {
      statusCode: 400,
      body: "You must provide the id of the resource you want to delete",
    };
  const parsedKey = JSON.parse(key);
  //delete record in dyanmo db table
  const result = await deleteTemplate({
    document: marshall(parsedKey as Image["pk"], {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
    tableName: convertToStr(
      process.env.AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME
    ),
    successMessage: "deleted record from projectImages",
  });
  return result;
}
