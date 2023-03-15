import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { drive_v3 } from "googleapis";
import { createChannel } from "../../../../../../../utils/google/googleDrive/watchChannels/createWatchChannel";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
import { deleteWatchChannel } from "../../../../../../../utils/google/googleDrive/watchChannels/deleteWatchChannel";
import { getWatchChannels } from "../../../../../../../utils/google/googleDrive/watchChannels/getWatchChannels";
import { searchForWatchedResource } from "../../../../../../../utils/google/googleDrive/watchChannels/searchForWatchedResource";
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "PUT")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const tableName = convertToStr(process.env.WEBHOOKS_DYNAMO_DB_TABLE_NAME);
  
  const drive = initalizeGoogleDrive({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: unescapeNewLines(
      convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    ),
  });
  //Set the topmost level directory
  const parentFolder = process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME;
  const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
  const topMostDirectoryId = await searchForWatchedResource({
    drive,
    folderName: convertToStr(folderName),
    parentFolder: convertToStr(parentFolder),
  });
  if (typeof topMostDirectoryId !== "string") return topMostDirectoryId;
  const activeChannels = await getWatchChannels({
    tableName,
    primaryKey: {
      topMostDirectory: topMostDirectoryId,
    },
  });
  if (activeChannels.statusCode !== 200) return activeChannels;
  const channelData = JSON.parse(activeChannels.body);
  const newChannelsArr = channelData.result.Items.map((channel: any) => {
    const watchChannel = channel as drive_v3.Schema$Channel & {
      topMostDirectory?: string;
      token?: string;
    };
    return createChannel({
      tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
      domain: process.env.WEBHOOKS_API_DOMAIN_NAME,
      topMostDirectoryId,
      drive,
      tableName,
      folderId: convertToStr(watchChannel.resourceId),
    });
  });
  const deletedChannelsArr = channelData.result.Items.map((channel: any) => {
    const watchChannel = channel as drive_v3.Schema$Channel & {
      topMostDirectory?: string;
      token?: string;
    };
    return deleteWatchChannel({
      drive,
      primaryKey: {
        topMostDirectory: topMostDirectoryId,
        id: convertToStr(watchChannel.resourceId),
      },
      tableName,
    });
  });
  const createPromiseArr = Promise.all(newChannelsArr);
  const deletePromiseArr = Promise.all(deletedChannelsArr);
  const [createdChannels, deletedChannels] = await Promise.all([
    createPromiseArr,
    deletePromiseArr,
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify({
      deletedChannels: deletedChannels,
      createdChannels: createdChannels,
    }),
  };
}
