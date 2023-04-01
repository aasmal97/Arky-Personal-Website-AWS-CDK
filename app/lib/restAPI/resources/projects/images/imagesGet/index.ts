import { APIGatewayEvent } from "aws-lambda";
import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { getTemplate } from "../../../../../../../utils/apiTemplates/getTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Image } from "../../../utils/types/projectTypes";
import {
  addParamater,
  initializeQueryResources,
  validateGeneralGetQuery,
} from "../../../../../../../utils/apiTemplates/generateDynamoQueries";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
export type ImageQueryProps = Partial<Image>;
const generateGetExpression = (query: ImageQueryProps) => {
  let { keyExpArr, filterExpArr, scanDirection, index, expAttrMap, expValMap } =
    initializeQueryResources();
  const { id, documentId, googleResourceId, imgDescription, placeholderURL } =
    query;
  if (typeof documentId === "string")
    addParamater({
      key: "documentId",
      value: documentId,
      expType: "equals",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: false,
    });
  if (typeof googleResourceId === "string")
    addParamater({
      key: "googleResourceId",
      value: googleResourceId,
      expType: "equals",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: false,
    });
  //add to filter exp
  if (typeof id === "string")
    addParamater({
      key: "id",
      value: id,
      expType: "equals",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: true,
    });
  if (typeof imgDescription === "string")
    addParamater({
      key: "imgDescription",
      value: imgDescription,
      expType: "contains",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: true,
    });
  if (typeof placeholderURL === "string")
    addParamater({
      key: "placeholderURL",
      value: placeholderURL,
      expType: "equals",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: true,
    });
  const expVal = marshall(expValMap, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
  const keyExp = keyExpArr.length
    ? keyExpArr.reduce((a, b) => a + " AND " + b)
    : undefined;
  const filterExp =
    filterExpArr.length > 0
      ? filterExpArr.reduce((a, b) => a + " AND " + b)
      : undefined;
  return {
    keyExp,
    expVal,
    expAttrMap,
    filterExp,
    scanDirection,
    index,
  };
};
const generateQuery = (e: APIGatewayEvent): QueryCommandInput | null => {
  const result = validateGeneralGetQuery(e);
  if (!result) return result;
  const { parsedQuery, parsedStartKey } = result;
  if (!parsedQuery.documentId) return null;
  const expParams = generateGetExpression(parsedQuery);
  if (!expParams) return expParams;
  const { keyExp, expVal, expAttrMap, filterExp, scanDirection, index } =
    expParams;
  const dynamoQuery: QueryCommandInput = {
    TableName: convertToStr(
      process.env.AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME
    ),
    KeyConditionExpression: keyExp,
    FilterExpression: filterExp,
    ExpressionAttributeNames: expAttrMap,
    ExpressionAttributeValues: expVal,
    ExclusiveStartKey: parsedStartKey,
    ScanIndexForward: scanDirection,
    IndexName: index,
  };
  return dynamoQuery;
};
export async function handler(event: APIGatewayEvent) {
  return await getTemplate({
    e: event,
    tableName: convertToStr(
      process.env.AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME
    ),
    successMessage: "Retrieved project results",
    generateQuery,
    partitionKey: "documentId",
    sortKey: "googleResourceId",
  });
}
