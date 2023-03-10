import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent } from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb";
import { getTemplate } from "../../../../../../utils/apiTemplates/getTemplate";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
export type HobbiesQueryProps = {
  id?: string;
  name?: string;
  description?: string;
  orientation: "vertical" | "horizontal";
  sortBy?: {
    dateCreated?: 1 | -1;
    dateTaken?: 1 | -1;
  };
};
export function isHobbyQueryProps(e: any): e is HobbiesQueryProps {
  try {
    return e.orientation;
  } catch (err) {
    return false;
  }
}
const generateGetExpression = (e: HobbiesQueryProps) => {
  let expression = `#orientationAtt = :orientationVal`;
  let filterExpArr: string[] = [];
  let scanDirection = true;
  let index: string | undefined;
  const expAttr: Record<string, string> = {
    "#orientationAtt": "orientation",
  };
  const expValMap: Record<string, any> = { ":orientationVal": e.orientation };
  const addParamater = (
    key: string,
    value: any,
    expType: "contains" | "equals"
  ) => {
    const expKey = `#${key}`;
    const expKeyVal = `:${key}val`;
    expAttr[expKey] = key;
    expValMap[expKeyVal] = value;
    const containsExp = `contains(${expKey}, ${expKeyVal})`;
    const equalExp = `${expKey} = ${expKeyVal}`;
    filterExpArr.push(expType === "contains" ? containsExp : equalExp);
  };
  if (typeof e.id === "string") addParamater("id", e.id, "equals");
  if (typeof e.name === "string") addParamater("name", e.name, "contains");
  if (typeof e.description === "string")
    addParamater("description", e.description, "contains");
  if (e.sortBy) {
    const dateCreated = e.sortBy.dateCreated;
    const dateTaken = e.sortBy.dateTaken;
    if (dateCreated === -1) scanDirection = false;
    if (!dateCreated && dateTaken === -1) scanDirection = false;
    if (!dateCreated && dateTaken) {
      index = "SortByDateTaken";
    }
  }
  const expVal = marshall(expValMap, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
  const filterExp = filterExpArr.reduce((a, b) => a + " AND " + b);
  return {
    keyExp: expression,
    expVal,
    expAttr,
    filterExp,
    scanDirection,
    index,
  };
};
const generateQuery = (e: APIGatewayEvent): QueryCommandInput | null => {
  if (!e.queryStringParameters) return null;
  const { startKey, query } = e.queryStringParameters;
  const parsedStartKey = startKey ? JSON.parse(startKey) : {};
  const parsedQuery = query ? JSON.parse(query) : {};
  if (!isHobbyQueryProps(parsedQuery)) return null;
  const { keyExp, expVal, expAttr, filterExp, scanDirection, index } =
    generateGetExpression(parsedQuery);
  const dynamoQuery: QueryCommandInput = {
    TableName: convertToStr(process.env.AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME),
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
  return await getTemplate({
    e: event,
    tableName: convertToStr(process.env.AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME),
    successMessage: "Retrieved hobby results",
    generateQuery: generateQuery,
  });
}
