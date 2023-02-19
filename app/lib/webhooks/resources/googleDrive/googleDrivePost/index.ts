import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import * as jwt from "jsonwebtoken";
type RequestProps = {
  token: string;
  resourseId: string;
  resourseURI: string;
  state: string;
  contentChanged: string;
  body: { [key: string]: any };
};
function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}

const validateRequest = (
  e: APIGatewayEvent
): RequestProps | APIGatewayProxyResult => {
  if (e.httpMethod !== "POST")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const headers = e.headers;
  const {
    "X-Goog-Channel-Token": token,
    "X-Goog-Resource-ID": resourseId,
    "X-Goog-Resource-URI": resourseURI,
    "X-Goog-Resource-State": state,
    "X-Goog-Changed": contentChanged,
  } = headers;
  if (!token)
    return {
      statusCode: 403,
      body: "Please provide a token. Access Denied",
    };

  const tokenSecret = process.env.WEBHOOKS_API_TOKEN_SECRET;
  const apiKey = process.env.WEBHOOKS_API_KEY;
  try {
    const decoded = jwt.verify(token, convertToStr(tokenSecret));
    if (
      typeof decoded === "string" ||
      (typeof decoded !== "string" && decoded.apiKey !== apiKey)
    ) {
      return {
        statusCode: 403,
        body: "Access is denied",
      };
    }
  } catch (err) {
    return {
      statusCode: 403,
      body: "Access is denied",
    };
  }

  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid body",
    };
  return {
    token: convertToStr(token),
    resourseId: convertToStr(resourseId),
    resourseURI: convertToStr(resourseURI),
    state: convertToStr(state),
    contentChanged: convertToStr(contentChanged),
    body: JSON.parse(e.body),
  };
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const request = validateRequest(e);
  if (isAPIGatewayResult(request)) return request;
  const { token, resourseId, resourseURI, state, contentChanged, body } =
    request;
  try {
    return {
      statusCode: 200,
      body: JSON.stringify(request),
      //body: "Success",
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
}
