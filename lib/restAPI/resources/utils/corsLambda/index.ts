import { APIGatewayProxyEvent } from "aws-lambda";
import { corsHeaders } from "@app/types";
export const handler = async (event: APIGatewayProxyEvent) => {
  const response = {
    statusCode: 200,
    headers: corsHeaders,
  };
  return response;
};
