import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

export async function handler(
    e: APIGatewayEvent
  ): Promise<APIGatewayProxyResult> {
    if (e.httpMethod !== "POST")
      return {
        statusCode: 405,
        body: "Wrong http request",
      };
  
    try {
      return {
        statusCode: 200,
        body: "Success",
      };
    } catch (e) {
      return {
        statusCode: 500,
        body: "Bad Request",
      };
    }
  }
  