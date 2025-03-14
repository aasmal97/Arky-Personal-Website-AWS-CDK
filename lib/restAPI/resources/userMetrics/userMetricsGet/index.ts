import { corsHeaders } from "@app/types";
import { METRIC_TYPE, UserMetricDocument } from "@app/types/userMetrics.types";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME, METRICS_DB_DEFAULT_PK_KEY } from "@lib/constants";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
const tableName = process.env[AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME];
const client = new DynamoDBClient({
  region: "us-east-1",
});
export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod !== "GET")
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "Wrong HTTP Method",
    };
  const queryCommand = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "#rt = :mtype",
    ExpressionAttributeNames: {
      "#rt": METRICS_DB_DEFAULT_PK_KEY,
    },
    ExpressionAttributeValues: {
      ":mType": {
        S: METRIC_TYPE.PERSONAL,
      },
    },
    ScanIndexForward: false,
    Limit: 1,
  });
  const queryCommandRes = await client.send(queryCommand);
  const rawDocument = queryCommandRes.Items?.[0];
  if (!rawDocument)
    return { statusCode: 404, headers: corsHeaders, body: "Invalid Request" };
  const { githubData, stackOverflowData } = unmarshall(
    rawDocument
  ) as UserMetricDocument;
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ stackOverflowData, githubData }),
  };
}
