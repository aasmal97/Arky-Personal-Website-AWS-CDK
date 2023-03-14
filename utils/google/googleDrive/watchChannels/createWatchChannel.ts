import { drive_v3 } from "googleapis";
import { v4 as uuid } from "uuid";
import { getUnixTime, add } from "date-fns";
import { convertToStr } from "../../../general/convertToStr";
import * as jwt from "jsonwebtoken";
import { dynamoPutDocument } from "../../../apiTemplates/putTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
import { searchForWatchedResource } from "./searchForWatchedResource";
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
  channelExpiration,
  tokenSecret,
}: {
  topMostDirectoryId: string;
  tokenSecret: string;
  folderId: string;
  channelExpiration: number;
}) => {
  const payload = {
    folder_id: folderId,
    channel_expiration: channelExpiration,
    topmost_directory_id: topMostDirectoryId,
  };
  const token = jwt.sign(payload, tokenSecret, { algorithm: "HS256" });
  return token;
};
export const createChannel = async ({
  topMostDirectoryId,
  domain,
  tokenSecret,
  folderId,
  drive,
  tableName,
}: {
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
    channelExpiration: parseInt(expiration),
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
  const channelData = JSON.parse(channel.body);
  const newDocument = { ...channelData, topMostDirectory: topMostDirectoryId };
  const result = await dynamoPutDocument({
    tableName,
    document: marshall(newDocument, {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
    successMessage: `Successfully added channel: ${newDocument.id} document`,
  });
  return {
    statusCode: 200,
    body: JSON.stringify({
      document: result.body,
      channel: channelData,
    }),
  };
};
export const createChannelInEnvFolder = async ({
    drive,
    folderId,
    tableName
  }: {
    drive: drive_v3.Drive;
    folderId: string;
    tableName: string;
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
    });
  };