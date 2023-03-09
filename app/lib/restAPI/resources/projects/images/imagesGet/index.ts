import { APIGatewayEvent } from "aws-lambda";
import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { getTemplate } from "../../../../../../../utils/apiTemplates/getTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Image } from "../../../types/projectTypes";
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
  const { id, documentId, imgURL, imgDescription, pk, placeholderURL } = query;
  if (pk) {
    addParamater({
      key: "documentId",
      value: pk.documentId,
      expType: "equals",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: false,
    });
    addParamater({
      key: "imgURL",
      value: pk.imgURL,
      expType: "equals",
      filterExpArr,
      keyExpArr,
      expValMap,
      expAttrMap,
      filter: false,
    });
  } else {
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
    if (typeof imgURL === "string")
      addParamater({
        key: "imgURL",
        value: imgURL,
        expType: "equals",
        filterExpArr,
        keyExpArr,
        expValMap,
        expAttrMap,
        filter: false,
      });
  }
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
    });
  const expVal = marshall(expValMap);
  const keyExp = keyExpArr.reduce((a, b) => a + " AND " + b);
  const filterExp = filterExpArr.reduce((a, b) => a + " AND " + b);
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
  if (!parsedQuery.pk && !parsedQuery.imgURL && !parsedQuery.documentId)
    return null;
  const { keyExp, expVal, expAttrMap, filterExp, scanDirection, index } =
    generateGetExpression(parsedQuery);
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
  });
}
