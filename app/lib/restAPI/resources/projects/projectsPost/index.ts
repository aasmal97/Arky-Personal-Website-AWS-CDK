import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { postTemplate } from "../../../../../../utils/apiTemplates/postTemplate";
import { ProjectDocument } from "../../types/projectTypes";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { marshall } from "@aws-sdk/util-dynamodb";

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
    appURL,
    githubURL,
    endDate,
    topics,
    archived
  } = body ;
  const document = {
    appURL: appURL,
    projectName: projectName,
    githubURL: githubURL,
    description: description,
    endDate: endDate,
    topics: topics,
    archived: archived,
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
    tableName: convertToStr(
        process.env.AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME
      ),
    successMessage: "Updated projects document",
  });
}
