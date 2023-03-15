import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import validateWehbookToken from "../../../../../../utils/general/validateWebookTokens";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { initalizeGoogleDriveActivity } from "../../../../../../utils/google/googleDrive/initalizeGoogleDriveActivity";
import { searchForFolderByChildResourceId } from "../../../../../../utils/google/googleDrive/searchForFolder";
import { searchForWatchedResource } from "../../../../../../utils/google/googleDrive/watchChannels/searchForWatchedResource";
import url = require("url");
import { JwtPayload } from "jsonwebtoken";
import { createChannel } from "../../../../../../utils/google/googleDrive/watchChannels/createWatchChannel";
import { createResource } from "../../../../../../utils/google/googleDrive/createResource";
import { removeResource } from "../../../../../../utils/google/googleDrive/removeResource";
import { deleteWatchChannel } from "../../../../../../utils/google/googleDrive/watchChannels/deleteWatchChannel";
export type RequestProps = {
  tokenPayload: JwtPayload;
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
  if (isAPIGatewayResult(tokenIsValid)) return tokenIsValid;

  return {
    tokenPayload: tokenIsValid,
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
  const { resourceId, resourceURI, state, contentChanged, body, tokenPayload } =
    request;
  const bucketName = convertToStr(process.env.S3_MEDIA_FILES_BUCKET_NAME);
  const drive = initalizeGoogleDrive({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: unescapeNewLines(
      convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    ),
  });
  //Set the topmost level directory
  const topMostDirectoryId = tokenPayload.topmost_directory_id;
  if (typeof topMostDirectoryId !== "string")
    return {
      statusCode: 403,
      body: "Invalid token payload",
    };
  const { file } = await searchForFolderByChildResourceId(
    drive,
    resourceId,
    false
  );
  const tableName = convertToStr(process.env.WEBHOOKS_DYNAMO_DB_TABLE_NAME);
  const restApiUrl = convertToStr(process.env.AMAZON_REST_API_DOMAIN_NAME);
  const restApiKey = convertToStr(process.env.AMAZON_REST_API_KEY);
  const vision = {
    apiKey: convertToStr(process.env.AZURE_COMPUTER_VISION_API_KEY),
    apiEndpoint: convertToStr(process.env.AZURE_COMPUTER_VISION_API_ENDPOINT),
  };
  let result: any;
  // switch (state) {
  //   case "add":
  //     if (file.mimeType === "application/vnd.google-apps.folder")
  //       result = createChannel({
  //         tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
  //         domain: process.env.WEBHOOKS_API_DOMAIN_NAME,
  //         topMostDirectoryId,
  //         drive,
  //         tableName,
  //         folderId: resourceId,
  //       });
  //     else
  //       result = createResource({
  //         restApiUrl,
  //         bucketName,
  //         apiKey: restApiKey,
  //         drive,
  //         resourceId,
  //         vision,
  //       });
  //     break;
  //   case "remove":
  //     if (file.mimeType === "application/vnd.google-apps.folder")
  //       result = deleteWatchChannel({
  //         primaryKey: {
  //           topMostDirectory: topMostDirectoryId,
  //           id: resourceId,
  //         },
  //         drive,
  //         tableName,
  //       });
  //     else
  //       result = removeResource({
  //         restApiUrl,
  //         bucketName,
  //         apiKey: restApiKey,
  //         resourceId,
  //       });
  //     break;
  //   case "update":
  //     if (file.mimeType === "application/vnd.google-apps.folder") {

  //     } else {
  //     }
  //     // const regex = new RegExp("", 'g')
  //     // if(contentChanged)
  //     break;
  //   default:
  //     break;
  // }
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        request: request,
        //changes: listLatestChanges
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Bad Request",
        error: e,
      }),
    };
  }
}
// const params = url.parse(resourceURI, true).query;
// const listLatestChanges = await drive.changes.list({
//   pageToken: typeof params.pageToken === "string" ? params.pageToken : ""
// });

// const driveActivity = initalizeGoogleDriveActivity({
//   client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//   private_key: unescapeNewLines(
//     convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
//   ),
// });
