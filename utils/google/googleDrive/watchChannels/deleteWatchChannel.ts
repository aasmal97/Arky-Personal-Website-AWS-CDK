import { marshall } from "@aws-sdk/util-dynamodb";
import { drive_v3 } from "googleapis";
import { deleteTemplate } from "../../../apiTemplates/deleteTemplate";
export const deleteWatchChannel = async ({
  drive,
  tableName,
  primaryKey,
  document,
}: {
  drive: drive_v3.Drive;
  tableName: string;
  primaryKey: any;
  document: drive_v3.Schema$Channel & {
    topMostDirectory?: string;
    token?: string;
  };
}) => {
  const newDoc = { ...document };
  if (newDoc.topMostDirectory) delete newDoc.topMostDirectory;
  if (newDoc.token) delete newDoc.token;
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
  return [dynamo, {
    statusCode: watch.status,
    data: watch.data
  }];
};
