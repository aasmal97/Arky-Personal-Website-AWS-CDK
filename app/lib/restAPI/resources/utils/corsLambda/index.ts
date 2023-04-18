import { APIGatewayProxyEvent } from "aws-lambda";
export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
};
export const corsPostHeaders = {
  ...corsHeaders,
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};
export const handler = async (event: APIGatewayProxyEvent) => {
  const response = {
    statusCode: 200,
    headers: corsHeaders,
  };
  return response;
};
