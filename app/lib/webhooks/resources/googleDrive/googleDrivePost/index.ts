import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

export async function handler(
    e: APIGatewayEvent
  ): Promise<APIGatewayProxyResult> {
    if (e.httpMethod !== "POST")
      return {
        statusCode: 405,
        body: "Wrong http request",
      };
    const token = e.headers.token
    if(token !== process.env.WEBHOOKS_API_TOKEN) return {
      statusCode: 403,
      body:"Access is denied"
    }
    const body = {
      
    }
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
  