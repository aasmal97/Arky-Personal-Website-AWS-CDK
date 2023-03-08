import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import validateWehbookToken from "../../../../../../utils/general/validateWebookTokens";
import { initalizeGoogleDrive, unescapeNewLines } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { initalizeGoogleDriveActivity } from "../../../../../../utils/google/googleDrive/initalizeGoogleDriveActivity";
export type RequestProps = {
  token: string;
  resourceId: string;
  resourceURI: string;
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
    "X-Goog-Resource-ID": resourceId,
    "X-Goog-Resource-URI": resourceURI,
    "X-Goog-Resource-State": state,
    "X-Goog-Changed": contentChanged,
  } = headers;
  const tokenIsValid = validateWehbookToken(token);
  if (tokenIsValid !== true) return tokenIsValid;
  return {
    token: convertToStr(token),
    resourceId: convertToStr(resourceId),
    resourceURI: convertToStr(resourceURI),
    state: convertToStr(state),
    contentChanged: convertToStr(contentChanged),
    body: e.body ? JSON.parse(e.body) : {},
  };
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const request = validateRequest(e);
  if (isAPIGatewayResult(request)) return request;
  const { resourceId, resourceURI, state, contentChanged, body } = request;
  const bucketName = convertToStr(process.env.S3_MEDIA_FILES_BUCKET_NAME);
  const drive = initalizeGoogleDrive({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: unescapeNewLines(
      convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    ),
  });
  const driveActivity = initalizeGoogleDriveActivity({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: unescapeNewLines(
      convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    ),
  });
  let result: any;
  switch (state) {
    case "add":

      break;
    case "remove":
      break;
    case "update":
      // const regex = new RegExp("", 'g')
      // if(contentChanged)
      break;
    default:
      break;
  }
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
