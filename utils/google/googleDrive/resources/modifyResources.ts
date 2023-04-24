import { convertToStr } from "../../../../utils/general/convertToStr";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { initializeDirectoryFileHistory } from "../../../../utils/google/googleDrive/initializeDirectoryFileHistory";
import { isAPIGatewayResult } from "../../../../utils/general/isApiGatewayResult";
import { JwtPayload } from "jsonwebtoken";
import {
  createChannel,
  isChannelDoc,
} from "../../../../utils/google/googleDrive/watchChannels/createWatchChannel";
import { createResource } from "../../../../utils/google/googleDrive/resources/createResource";
import { removeResource } from "../../../../utils/google/googleDrive/resources/removeResource";
import { deleteWatchChannel } from "../../../../utils/google/googleDrive/watchChannels/deleteWatchChannel";
export const modifyResources = async ({
  resourceId,
  tokenPayload,
}: {
  resourceId: string;
  tokenPayload: JwtPayload;
}) => {
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
  const tokenSecret = process.env.WEBHOOKS_API_TOKEN_SECRET;
  const webhooksAPIDomainName = process.env.WEBHOOKS_API_DOMAIN_NAME
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
  //return fileHistoryResults
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

  // add resources
  const addResourcePromise = currFilesInFolder.map((file) => {
    if (!file.id) return null;
    if (!(file.id in prevFilesMap)) {
      if (file.mimeType === "application/vnd.google-apps.folder")
        return createChannel({
          parentDirectoryId: resourceId,
          tokenSecret,
          domain: webhooksAPIDomainName,
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
  try {
    const resultsArr = await Promise.all([
      ...addResourcePromise,
      ...deleteResourcePromise,
    ]);
    return {
      statusCode: 200,
      body: JSON.stringify({
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
};
