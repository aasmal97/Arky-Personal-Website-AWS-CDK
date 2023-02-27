import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
const validateIncomingResponse = (e: APIGatewayEvent) => {
  if (e.httpMethod !== "POST")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const { "x-hub-signature": token } = e.headers;
  const secret = convertToStr(process.env.WEBHOOKS_API_TOKEN_SECRET);
  try {
    if (!token)
      return {
        statusCode: 403,
        body: "Please provide a token. Access Denied",
      };
    jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return {
      statusCode: 403,
      body: "Access is denied. Invalid token",
    };
  }
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid body",
    };
  return true;
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const isValid = validateIncomingResponse(e);
  if (isValid !== true) isValid;
  
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
