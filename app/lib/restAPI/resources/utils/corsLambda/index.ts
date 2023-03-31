import { APIGatewayProxyEvent } from "aws-lambda";
export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
};
export const handler = async (event: APIGatewayProxyEvent) => {
  const response = {
    statusCode: 200,
    headers: corsHeaders,
  };
  return response;
};
