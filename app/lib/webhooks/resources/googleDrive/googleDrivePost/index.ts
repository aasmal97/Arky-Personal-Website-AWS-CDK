import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import validateWehbookToken from "../../../../../../utils/general/validateWebookTokens";
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
  const tokenIsValid = validateWehbookToken(token);
  if (tokenIsValid !== true) return tokenIsValid;
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
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
}
