//fetch items from  dynamodb table
import { APIGatewayEvent } from "aws-lambda";
import {
  getTemplate,
} from "../../../../../../utils/apiTemplates/getTemplate";
import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { validateGeneralGetQuery } from "../../../../../../utils/apiTemplates/generateDynamoQueries";
const generateGetExpression = (event: APIGatewayEvent) => {
  let expression = `#recordTypeAtt = :recordTypeVal`;
  let filterExpArr: string[] = [];
  let scanDirection = true;
  let index: string | undefined;
  const expAttr: Record<string, any> = {
    "#recordTypeAtt": "recordType",
  };
  const expValMap: Record<string, any> = {
    ":recordTypeVal": "skill",
  };
  const expVal = marshall(expValMap, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
  const filterExp =
    filterExpArr.length > 0
      ? filterExpArr.reduce((a, b) => a + " AND " + b)
      : undefined;
  return {
    keyExp: expression,
    expVal,
    expAttr,
    filterExp,
    scanDirection,
    index,
  };
};
const generateQuery = (event: APIGatewayEvent) => {
  const result = validateGeneralGetQuery(event);
  if (!result) return result;
  const { parsedStartKey, parsedQuery } = result;

  const { keyExp, expVal, expAttr, filterExp, scanDirection, index } =
    generateGetExpression(parsedQuery);
  const dynamoQuery: QueryCommandInput = {
    TableName: convertToStr(process.env.AMAZON_DYNAMO_DB_SKILLS_TABLE_NAME),
    KeyConditionExpression: keyExp,
    FilterExpression: filterExp,
    ExpressionAttributeNames: expAttr,
    ExpressionAttributeValues: expVal,
    ExclusiveStartKey: parsedStartKey,
    ScanIndexForward: scanDirection,
    IndexName: index,
  };
  return dynamoQuery;
};
export async function handler(event: APIGatewayEvent) {
  const projectDocsRes = await getTemplate({
    e: event,
    tableName: convertToStr(process.env.AMAZON_DYNAMO_DB_SKILLS_TABLE_NAME),
    successMessage: "Retrieved project results",
    generateQuery,
    partitionKey: "recordType",
    sortKey: "startDate",
  });
  return projectDocsRes;
}
