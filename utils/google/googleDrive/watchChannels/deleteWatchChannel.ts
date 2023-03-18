import { marshall } from "@aws-sdk/util-dynamodb";
import { drive_v3 } from "googleapis";
import { deleteTemplate } from "../../../apiTemplates/deleteTemplate";
import { getWatchChannels } from "./getWatchChannels";
type FileWatchChannelProps = drive_v3.Schema$Channel & {
  topMostDirectory?: string;
  token?: string;
};
export const deleteWatchChannel = async ({
  drive,
  tableName,
  primaryKey,
}: {
  drive: drive_v3.Drive;
  tableName: string;
  primaryKey: {
    topMostDirectory: string;
    id?: string;
  };
}) => {
  const getChannel = await getWatchChannels({
    tableName,
    primaryKey,
  });
  if (getChannel.statusCode !== 200)
    return {
      message: `Error, could not find channel ${primaryKey.id}`,
    };
  const parsedChannelBody = JSON.parse(getChannel.body);
  const items = parsedChannelBody?.result?.Items;
  const document = items?.[0];
  if (!document)
    return {
      message: `Could not find channel ${primaryKey.id}`,
    };
  const newDoc = { ...document };
  if (newDoc.topMostDirectory) delete newDoc.topMostDirectory;
  if (newDoc.token) delete newDoc.token;
  //change this
  newDoc.id = newDoc.channelResourceId
  const watchChannel = drive.channels.stop({
    requestBody: newDoc,
  });
  const dynamoResult = deleteTemplate({
    tableName,
    successMessage: `Deleted watch channel ${primaryKey.id}`,
    document: marshall(primaryKey, {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
  });

  const [dynamo, watch] = await Promise.all([dynamoResult, watchChannel]);
  return [
    dynamo,
    {
      statusCode: watch.status,
      data: watch.data,
    },
  ];
};
