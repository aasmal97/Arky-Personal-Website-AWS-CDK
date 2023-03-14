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
  document: drive_v3.Schema$Channel;
}) => {
  const watchChannel = drive.channels.stop({
    requestBody: document,
  });
  const dynamoResult = deleteTemplate({
    tableName,
    successMessage: `Deleted watch channel ${primaryKey.id}`,
    document: marshall(primaryKey, {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    }),
  });

  return await Promise.all([dynamoResult, watchChannel]);
};
