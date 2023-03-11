import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { deleteTemplate } from "../../../../../../utils/apiTemplates/deleteTemplate";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { marshall } from "@aws-sdk/util-dynamodb";

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
  try {
    const result = await deleteTemplate({
      document: marshall(key),
      tableName: convertToStr(process.env.AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME),
      successMessage: "deleted user image in hobbies",
    });
    return result;
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Bad Request",
        error: e
      }),
    };
  }
}
