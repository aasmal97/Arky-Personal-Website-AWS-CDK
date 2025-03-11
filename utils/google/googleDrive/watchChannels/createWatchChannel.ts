import { drive_v3 } from "googleapis";
import { v4 as uuid } from "uuid";
import { getUnixTime, add } from "date-fns";
import { convertToStr } from "@utils/general/convertToStr";
import * as jwt from "jsonwebtoken";
import { dynamoPutDocument } from "@utils/apiTemplates/putTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
import { searchForWatchedResource } from "./searchForWatchedResource";
export type ChannelDocument = {
  pk: {
    topMostDirectory: string;
    id: string;
  };
  id: string;
  channelResourceId?: string | null;
  topMostDirectory: string;
  expiration?: number;
  parentDirectoryId?: string | null;
} & Omit<drive_v3.Schema$Channel, "expiration">;
export function isChannelDoc(e: any): e is ChannelDocument {
  try {
    return e.channelResourceId;
  } catch (err) {
    return false;
  }
}
export const createWatchChannel = async ({
  drive,
  fileId,
  token,
  domainName,
  expiration,
}: {
  drive: drive_v3.Drive;
  fileId: string;
  token: string;
  domainName: string;
  expiration: string;
}) => {
  try {
    //create watch channel
    const watchRes = await drive.files.watch({
      fileId,
      fields: "*",
      requestBody: {
        resourceId: fileId,
        id: uuid(),
        token: token,
        type: "web_hook",
        expiration: expiration,
        address: `https://${domainName}/googleDrive`,
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(watchRes.data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
export const createJWT = async ({
  folderId,
  topMostDirectoryId,
  tokenSecret,
}: {
  topMostDirectoryId: string;
  tokenSecret: string;
  folderId: string;
}) => {
  const payload = {
    folder_id: folderId,
    topmost_directory_id: topMostDirectoryId,
  };
  const token = jwt.sign(payload, tokenSecret, {
    noTimestamp: true,
    algorithm: "HS256",
  });
  return token;
};
export const createChannel = async ({
  topMostDirectoryId,
  domain,
  tokenSecret,
  folderId,
  drive,
  tableName,
  parentDirectoryId,
}: {
  parentDirectoryId?: string | null;
  tableName: string;
  drive: drive_v3.Drive;
  topMostDirectoryId: string;
  domain?: string;
  tokenSecret?: string;
  folderId: string;
}) => {
  const domainName = convertToStr(domain);
  const currDate = new Date();
  const endWatchDate = add(currDate, {
    hours: 23,
  });
  const expiration = (getUnixTime(endWatchDate) * 1000).toString();
  const token = await createJWT({
    folderId,
    topMostDirectoryId: topMostDirectoryId,
    tokenSecret: convertToStr(tokenSecret),
  });
  const channel = await createWatchChannel({
    drive,
    fileId: convertToStr(folderId),
    expiration: expiration,
    domainName,
    token,
  });
  if (channel.statusCode !== 200) return channel;
  //upload to Dynamo DB
  const channelData = JSON.parse(channel.body) as drive_v3.Schema$Channel;
  const newDocument: ChannelDocument = {
    ...channelData,
    pk: {
      id: convertToStr(folderId),
      topMostDirectory: topMostDirectoryId,
    },
    id: convertToStr(folderId),
    channelResourceId: channelData.id,
    topMostDirectory: topMostDirectoryId,
    expiration: channelData.expiration
      ? parseInt(channelData.expiration)
      : undefined,
    parentDirectoryId,
  };
  const result = await dynamoPutDocument({
    tableName,
    document: marshall(newDocument, {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
    successMessage: `Successfully added channel: ${newDocument.id} document`,
  });
  if (result.statusCode !== 200) return result;
  return {
    statusCode: 200,
    body: JSON.stringify({
      document: newDocument,
      channel: channelData,
    }),
  };
};
export const createChannelInEnvFolder = async ({
  drive,
  folderId,
  tableName,
  parentDirectoryId,
}: {
  drive: drive_v3.Drive;
  folderId: string;
  tableName: string;
  parentDirectoryId?: string | null;
}) => {
  //Set the topmost level directory
  const parentFolder = process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME;
  const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
  const topMostDirectoryId = await searchForWatchedResource({
    drive,
    folderName: convertToStr(folderName),
    parentFolder: convertToStr(parentFolder),
  });
  if (typeof topMostDirectoryId !== "string") return topMostDirectoryId;
  return await createChannel({
    tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
    domain: process.env.WEBHOOKS_API_DOMAIN_NAME,
    folderId,
    topMostDirectoryId,
    drive,
    tableName,
    parentDirectoryId,
  });
};
