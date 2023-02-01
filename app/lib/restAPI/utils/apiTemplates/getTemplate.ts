import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}
const queryOnce = async ({
  tableName,
  startKey,
}: {
  tableName: string;
  startKey?: Record<string, AttributeValue>;
}): Promise<QueryCommandOutput | APIGatewayProxyResult> => {
  const params: QueryCommandInput = {
    TableName: tableName,
    ExclusiveStartKey: startKey,
  };
  const client = new DynamoDBClient({
    region: "us-east-1",
  });
  const command = new QueryCommand(params);
  try {
    const results = await client.send(command);
    return results;
  } catch (e) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
};
const generateLastEvalKey = (
  item: Record<string, AttributeValue>,
  keyStructure?: Record<string, AttributeValue>
) => {
  const newKeyStructure: Record<string, AttributeValue> = {};
  if (!keyStructure) return keyStructure;
  const entries = Object.entries(item);
  entries.forEach(([key, value]) => {
    newKeyStructure[key] = item[key];
  });
  return newKeyStructure;
};
function mergeArrUntilLength<T>(arr1: T[], arr2: T[], maxLength: number) {
  if (arr1.length > maxLength) return arr1.splice(0, maxLength);
  let results = arr1;
  for (let i of arr2) {
    if (results.length <= maxLength) results.push(i);
    else return results;
  }
  return results;
}
const queryUntilRequestPageNum = async ({
  successMessage,
  tableName,
  maxResults = 50,
}: {
  tableName: string;
  successMessage: string;
  maxResults?: number;
}) => {
  let lastEval = true;
  let results: Omit<QueryCommandOutput, "$metadata"> = {
    Items: [],
  };
  //caps any document from returning a max of 100 items, to prevent abuse
  const resultsToBeReturned = maxResults > 100 ? 100 : maxResults;
  let queryOutput: QueryCommandOutput | APIGatewayProxyResult | undefined;
  let numLeft = resultsToBeReturned;
  let startKey: undefined | Record<string, AttributeValue>;
  const successResponse = (
    newResults: Omit<QueryCommandOutput, "$metadata">
  ) => ({
    statusCode: 200,
    body: JSON.stringify({
      message: successMessage,
      newResults: newResults,
    }),
  });

  while (lastEval) {
    queryOutput = await queryOnce({
      tableName,
      startKey: startKey,
    });
    //this means an error has occurred
    if (isAPIGatewayResult(queryOutput)) return queryOutput;
    const newItems = queryOutput.Items;
    if (!newItems) return successResponse(results);
    if (!results.Items)
      results.Items = mergeArrUntilLength([], newItems, numLeft);
    else results.Items = mergeArrUntilLength(results.Items, newItems, numLeft);
    numLeft = resultsToBeReturned - results.Items.length;
    if (results.Items.length <= 0) {
      const newOutput: Partial<QueryCommandOutput> = {
        ...queryOutput,
      };
      delete newOutput["$metadata"];
      return successResponse(newOutput);
    }
    //generate new last eval key
    results.LastEvaluatedKey = generateLastEvalKey(
      results.Items[results.Items.length - 1],
      results.LastEvaluatedKey
    );
    results.Count = results.Items.length;
    if (!results.LastEvaluatedKey || numLeft <= 0) {
      lastEval = false;
      break;
    }
  }
  return successResponse(results);
};
export const getTemplate = async ({
  e,
  tableName,
  successMessage,
  query,
  maxResults,
}: {
  tableName: string;
  e: APIGatewayProxyEvent;
  successMessage: string;
  query: QueryCommandInput;
  maxResults?: number;
}): Promise<APIGatewayProxyResult> => {
  if (e.httpMethod !== "GET")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  if (!e.queryStringParameters)
    return {
      statusCode: 400,
      body: "Please provide valid parameters",
    };
  if (!query)
    return {
      statusCode: 400,
      body: "Please provide a valid query",
    };
  const result = await queryUntilRequestPageNum({
    tableName,
    successMessage,
    maxResults,
  });
  return result;
};
