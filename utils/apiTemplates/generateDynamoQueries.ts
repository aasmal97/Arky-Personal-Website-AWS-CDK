import { APIGatewayEvent } from "aws-lambda";
export const addParamater = ({
  key,
  value,
  expType,
  filter = true,
  expAttrMap,
  expValMap,
  filterExpArr,
  keyExpArr,
}: {
  key: string;
  value: any;
  expType: "contains" | "equals";
  filter?: boolean;
  filterExpArr: string[];
  keyExpArr: string[];
  expAttrMap: Record<string, any>;
  expValMap: Record<string, any>;
}) => {
  const expKey = `#${key}`;
  const expKeyVal = `:${key}val`;
  expAttrMap[expKey] = key;
  expValMap[expKeyVal] = value;
  const containsExp = `contains(${expKey}, ${expKeyVal})`;
  const equalExp = `${expKey} = ${expKeyVal}`;
  if (filter)
    filterExpArr.push(expType === "contains" ? containsExp : equalExp);
  else keyExpArr.push(expType === "contains" ? containsExp : equalExp);
};
export const initializeQueryResources = () => {
  let keyExpArr: string[] = [];
  let filterExpArr: string[] = [];
  let scanDirection = true;
  let index: string | undefined;
  const expAttrMap: Record<string, any> = {};
  const expValMap: Record<string, any> = {};
  return {
    keyExpArr,
    filterExpArr,
    scanDirection,
    index,
    expAttrMap,
    expValMap,
  };
};
export const validateGeneralGetQuery = (e: APIGatewayEvent) => {
  if (!e.queryStringParameters) return null;
  const { startKey, query } = e.queryStringParameters;
  const parsedStartKey = startKey ? JSON.parse(startKey) : {};
  const parsedQuery = query ? JSON.parse(query) : {};
  return { parsedStartKey, parsedQuery };
};
