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
  expType: "contains" | "equals" | "greater than" | "less than";
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
  const lessThanExp = `${expKey} <= ${expKeyVal}`;
  const greaterThanExp = `${expKey} >= ${expKeyVal}`;
  let exp: string;
  switch (expType) {
    case "contains":
      exp = containsExp;
      break;
    case "equals":
      exp = equalExp;
      break;
    case "greater than":
      exp = greaterThanExp;
      break;
    case "less than":
      exp = lessThanExp;
      break;
    default:
      exp = equalExp;
      break;
  }
  if (filter) filterExpArr.push(exp);
  else keyExpArr.push(exp);
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
  const parsedStartKey = startKey ? JSON.parse(startKey) : undefined;
  const parsedQuery = query ? JSON.parse(query) : {};
  return { parsedStartKey, parsedQuery };
};
