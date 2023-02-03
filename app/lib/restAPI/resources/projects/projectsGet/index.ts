import { APIGatewayEvent } from "aws-lambda";
import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { getTemplate } from "../../../utils/apiTemplates/getTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
export type ProjectQueryProps = {
  id?: string;
  appURL?: string;
  projectName?: string;
  description?: string;
  sortBy?: {
    startDate?: 1 | -1;
    endDate?: 1 | -1;
  };
  recordType: string;
};
function isProjectQueryProps(e: any): e is ProjectQueryProps {
  try {
    return e.recordType;
  } catch (err) {
    return false;
  }
}
const generateGetExpression = (query: ProjectQueryProps) => {
  let expression = `#recordTypeAtt = :recordTypeVal`;
  let filterExpArr: string[] = [];
  let scanDirection = true;
  let index: string | undefined;
  const expAttr: Record<string, string> = {
    "#recordTypeAtt": "recordType",
  };
  const expValMap: Record<string, any> = {
    ":recordTypeVal": query.recordType,
  };
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
  const { id, appURL, projectName, description, sortBy } = query;
  if (typeof id === "string") addParamater("id", id, "equals");
  if (typeof projectName === "string")
    addParamater("projectName", projectName, "contains");
  if (typeof description === "string")
    addParamater("description", description, "contains");
  if (typeof appURL === "string") addParamater("appURL", appURL, "contains");
  if (sortBy) {
    const startDate = sortBy.startDate;
    const endDate = sortBy.endDate;
    if (startDate === -1) scanDirection = false;
    if (!startDate && endDate === -1) scanDirection = false;
    if (!startDate && endDate) {
      index = "SortByDateEnded";
    }
  }
  const expVal = marshall(expValMap);
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
  if (!isProjectQueryProps(parsedQuery)) return null;
  const { keyExp, expVal, expAttr, filterExp, scanDirection, index } =
    generateGetExpression(parsedQuery);
  const dynamoQuery: QueryCommandInput = {
    TableName: "hobbies",
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
    tableName: "hobbies",
    successMessage: "Retrieved project results",
    generateQuery,
  });
}
