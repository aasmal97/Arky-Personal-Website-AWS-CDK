import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import validateWehbookToken from "../../../../../../utils/general/validateWebookTokens";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { initializeDirectoryFileHistory } from "../../../../../../utils/google/googleDrive/initializeDirectoryFileHistory";
import { isAPIGatewayResult } from "../../../../../../utils/general/isApiGatewayResult";
import { JwtPayload } from "jsonwebtoken";
import {
  createChannel,
  isChannelDoc,
} from "../../../../../../utils/google/googleDrive/watchChannels/createWatchChannel";
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
    "X-Goog-Resource-URI": resourceURI,
    "X-Goog-Resource-State": state,
    "X-Goog-Changed": contentChanged,
  } = headers;
  const tokenIsValid = validateWehbookToken(token);
  if (isAPIGatewayResult(tokenIsValid)) return tokenIsValid;

  return {
    tokenPayload: tokenIsValid,
    resourceId: convertToStr(tokenIsValid.folder_id),
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
  if (state === "sync")
    return {
      statusCode: 200,
      body: "Webhook connection recieved",
    };
  if (state !== "update" && contentChanged !== "children")
    return {
      statusCode: 200,
      body: JSON.stringify({
        state: state,
        contentChanged: contentChanged,
        message: "This webhook does not handle this type of notification yet",
      }),
    };
  const webhooksTableName = convertToStr(
    process.env.WEBHOOKS_DYNAMO_DB_TABLE_NAME
  );
  const restApiUrl = convertToStr(process.env.AMAZON_REST_API_DOMAIN_NAME);
  const restApiKey = convertToStr(process.env.AMAZON_REST_API_KEY);
  const vision = {
    apiKey: convertToStr(process.env.AZURE_COMPUTER_VISION_API_KEY),
    apiEndpoint: convertToStr(process.env.AZURE_COMPUTER_VISION_API_ENDPOINT),
  };
  const fileHistoryResults = await initializeDirectoryFileHistory({
    drive,
    resourceId,
    restApiKey,
    restApiUrl,
    topMostDirectoryId,
    webhooksTableName,
  });
  if (isAPIGatewayResult(fileHistoryResults)) return fileHistoryResults;
  const { prevFilesInFolder, currFilesInFolder } = fileHistoryResults;
  //generate object map for O(1) loop up
  const currFilesMap: { [key: string]: any } = {};
  const prevFilesMap: { [key: string]: any } = {};
  prevFilesInFolder.forEach((file) => {
    if (file.id) prevFilesMap[file.id] = file;
  });
  currFilesInFolder.forEach((file) => {
    if (file.id) currFilesMap[file.id] = file;
  });
  //add resources
  const addResourcePromise = currFilesInFolder.map((file) => {
    if (!file.id) return null;
    if (!(file.id in prevFilesMap)) {
      if (file.mimeType === "application/vnd.google-apps.folder")
        return createChannel({
          parentDirectoryId: resourceId,
          tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
          domain: process.env.WEBHOOKS_API_DOMAIN_NAME,
          topMostDirectoryId,
          drive,
          tableName: webhooksTableName,
          folderId: file.id,
        });
      else
        return createResource({
          restApiUrl,
          bucketName,
          apiKey: restApiKey,
          drive,
          resourceId: file.id,
          vision,
        });
    }
    return null;
  });
  //delete resources
  const deleteResourcePromise = prevFilesInFolder.map((file) => {
    if (!file.id) return null;
    if (!(file.id in currFilesMap)) {
      if (isChannelDoc(file.data))
        return deleteWatchChannel({
          primaryKey: {
            topMostDirectory: topMostDirectoryId,
            id: file.id,
          },
          drive,
          tableName: webhooksTableName,
        });
      else
        return removeResource({
          restApiUrl,
          bucketName,
          apiKey: restApiKey,
          resourceId: file.id,
        });
    }
    return null;
  });
  const resultsArr = await Promise.all([
    ...addResourcePromise,
    ...deleteResourcePromise,
  ]);
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        request: request,
        //filter out null or undefined values
        result: resultsArr.filter((e) => e),
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