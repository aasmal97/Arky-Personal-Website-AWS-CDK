import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { corsHeaders } from "../../app/lib/restAPI/resources/utils/corsLambda";
export type SuccessResponseProps = {
  message: string;
  result: Omit<QueryCommandOutput, "$metadata" | "Items"> & {
    Items: Record<string, any>[];
  };
};
function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}
export const queryOnce = async ({
  tableName,
  startKey,
  query,
}: {
  tableName: string;
  startKey?: Record<string, AttributeValue>;
  query: QueryCommandInput;
}): Promise<QueryCommandOutput | APIGatewayProxyResult> => {
  const params: QueryCommandInput = {
    ...query,
    //these override the user-given query because they are either
    //fully or partially managed by the template, and not by user input
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
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Bad Request",
        error: e,
      }),
    };
  }
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
function unmarshallItems(items: Record<string, AttributeValue>[]) {
  return items.map((i) => unmarshall(i));
}

const successResponse = (
  result: Omit<QueryCommandOutput, "$metadata">,
  successMessage: string
) => {
  if (!result.Items)
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: successMessage,
        result: {
          ...result,
          Items: [],
          Count: 0,
        },
      } as SuccessResponseProps),
    };
  const jsonItems = unmarshallItems(result.Items);
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: successMessage,
      result: {
        ...result,
        Items: jsonItems,
      },
    } as SuccessResponseProps),
  };
};
export const queryUntilRequestPageNum = async ({
  successMessage,
  tableName,
  maxResults = 50,
  query,
  partitionKey,
  sortKey,
}: {
  partitionKey: string;
  sortKey: string;
  query: QueryCommandInput;
  tableName: string;
  successMessage: string;
  maxResults?: number;
}) => {
  let lastEval = true;
  let results: Omit<QueryCommandOutput, "$metadata"> = {
    Items: [],
  };
  //caps any document from returning a max of 1000 items, to prevent abuse
  const resultsToBeReturned = maxResults > 1000 ? 1000 : maxResults;
  let queryOutput: QueryCommandOutput | APIGatewayProxyResult | undefined;
  let numLeft = resultsToBeReturned;
  let startKey: undefined | Record<string, AttributeValue> =
    query.ExclusiveStartKey;

  while (lastEval) {
    queryOutput = await queryOnce({
      tableName,
      startKey: startKey,
      query: query,
    });
    //this means an error has occurred
    if (isAPIGatewayResult(queryOutput)) return queryOutput;
    const newItems = queryOutput.Items;
    if (!newItems) return successResponse(results, successMessage);
    if (!results.Items)
      results.Items = mergeArrUntilLength([], newItems, numLeft);
    else results.Items = mergeArrUntilLength(results.Items, newItems, numLeft);
    numLeft -= results.Items.length;
    if (results.Items.length <= 0) {
      const newOutput: Partial<QueryCommandOutput> = {
        ...queryOutput,
      };
      delete newOutput["$metadata"];
      return successResponse(newOutput, successMessage);
    }

    //generate new last eval key if we have achieved
    //over the desired number of documents
    if (numLeft < 0) {
      const docWithNewKeyIdx = results.Items.length + numLeft;
      const docWithNewKey = unmarshall({ ...results.Items[docWithNewKeyIdx] });
      const docKey = marshall(docWithNewKey["pk"], {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      });
      const docPartitionKey = docKey[partitionKey];
      const docSortKey = docKey[sortKey];
      const expression = `#partition = :partitionVal and #sort = :sortVal`;
      const docWithKeyResult = await queryOnce({
        tableName,
        query: {
          TableName: tableName,
          KeyConditionExpression: expression,
          ExpressionAttributeNames: {
            "#partition": partitionKey,
            "#sort": sortKey,
          },
          ExpressionAttributeValues: {
            ":partitionVal": docPartitionKey,
            ":sortVal": docSortKey,
          },
          Limit: 1,
        },
      });
      //error encountered retrieving document
      if (isAPIGatewayResult(docWithKeyResult)) return docWithKeyResult;
      //return successResponse(results, successMessage);
      results.LastEvaluatedKey = docWithKeyResult.LastEvaluatedKey;
      // const newKey = marshall(
      //   { ...docWithNewKey["pk"] },
        // {
        //   convertClassInstanceToMap: true,
        //   removeUndefinedValues: true,
        // }
      // );
      // marshall(docWithNewKey)
      //results.LastEvaluatedKey = newKey
    }
    results.Count = results.Items.length;
    if (!results.LastEvaluatedKey || numLeft <= 0) {
      lastEval = false;
      break;
    }
  }
  return successResponse(results, successMessage);
};
export const getTemplate = async ({
  e,
  tableName,
  successMessage,
  generateQuery,
  partitionKey,
  sortKey,
}: {
  tableName: string;
  e: APIGatewayProxyEvent;
  successMessage: string;
  generateQuery: (e: APIGatewayProxyEvent) => QueryCommandInput | null;
  partitionKey: string;
  sortKey: string;
}): Promise<APIGatewayProxyResult> => {
  if (e.httpMethod !== "GET")
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: "Wrong http request",
    };
  if (!e.queryStringParameters)
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "Please provide valid parameters",
    };
  const query = generateQuery(e);
  //for pagaination
  const { max } = e.queryStringParameters;
  const maxResults = typeof max === "string" ? parseInt(max) : undefined;
  if (!query)
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "Please provide a valid query",
    };

  const result = await queryUntilRequestPageNum({
    tableName,
    successMessage,
    maxResults,
    query,
    partitionKey,
    sortKey,
  });
  return result;
};
