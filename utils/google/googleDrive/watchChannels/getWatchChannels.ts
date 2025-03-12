import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  initializeQueryResources,
  addParamater,
} from "@utils/apiTemplates/generateDynamoQueries";
import { queryUntilRequestPageNum } from "@utils/apiTemplates/getTemplate";
import { corsHeaders } from "@app/types";
const generateQuery = ({
  tableName,
  primaryKey,
  expiration,
  parentDirectoryId,
}: {
  tableName: string;
  primaryKey: Record<string, any>;
  expiration?: {
    type: "less than" | "greater than";
    unixTime: number;
  };
  parentDirectoryId?: string | null;
}): QueryCommandInput => {
  const {
    keyExpArr,
    filterExpArr,
    scanDirection,
    index,
    expAttrMap,
    expValMap,
  } = initializeQueryResources();
  if (primaryKey["topMostDirectory"])
    addParamater({
      key: "topMostDirectory",
      value: primaryKey["topMostDirectory"],
      expType: "equals",
      expAttrMap,
      expValMap,
      keyExpArr,
      filterExpArr,
      filter: false,
    });
  if (primaryKey["id"])
    addParamater({
      key: "id",
      value: primaryKey["id"],
      expType: "equals",
      expAttrMap,
      expValMap,
      keyExpArr,
      filterExpArr,
      filter: false,
    });
  if (expiration)
    addParamater({
      key: "expiration",
      value: expiration.unixTime,
      expType: expiration.type,
      expAttrMap,
      expValMap,
      keyExpArr,
      filterExpArr,
      filter: false,
    });
  if (parentDirectoryId)
    addParamater({
      key: "parentDirectoryId",
      value: parentDirectoryId,
      expType: "equals",
      expAttrMap,
      expValMap,
      keyExpArr,
      filterExpArr,
      filter: true,
    });
  const keyExp = keyExpArr.length
    ? keyExpArr.reduce((a, b) => a + " AND " + b)
    : undefined;
  const filterExp =
    filterExpArr.length > 0
      ? filterExpArr.reduce((a, b) => a + " AND " + b)
      : undefined;
  const expVal = marshall(expValMap, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
  const dynamoQuery: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: keyExp,
    FilterExpression: filterExp,
    ExpressionAttributeNames: expAttrMap,
    ExpressionAttributeValues: expVal,
    ScanIndexForward: scanDirection,
    IndexName: expiration ? "SearchByExpiration" : index,
  };
  return dynamoQuery;
};
export const getWatchChannels = async ({
  tableName,
  primaryKey,
  expiration,
  parentDirectoryId,
}: {
  primaryKey: {
    topMostDirectory: string;
    id?: string;
  };
  tableName: string;
  expiration?: {
    type: "less than" | "greater than";
    unixTime: number;
  };
  parentDirectoryId?: string | null;
}) => {
  if (!primaryKey["topMostDirectory"])
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "You must supply a the partition key, topMostDirectory",
    };
  const result = await queryUntilRequestPageNum({
    query: generateQuery({
      tableName,
      primaryKey,
      expiration,
      parentDirectoryId,
    }),
    successMessage: "Successfully got watch channels",
    tableName,
    maxResults: 1000,
    partitionKey: "topMostDirectory",
    sortKey: "id",
  });
  return result;
};
