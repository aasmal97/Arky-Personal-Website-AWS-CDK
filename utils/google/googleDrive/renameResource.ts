import { drive_v3, driveactivity_v2 } from "googleapis";
import { getDriveFileActivity } from "./getDriveFileActivity";
import { marshall } from "@aws-sdk/util-dynamodb";
import { updateDocument } from "../../crudRestApiMethods/postMethod";
import { getDocuments } from "../../crudRestApiMethods/getMethod";

//this is only meant for folders, when they're renamed.
//image files getting re-named don't matter since
//their contents remain the same in our table
export const renameResource = async ({
  driveActivity,
  restApiUrl,
  apiKey,
  bucketName,
  resourceId,
  drive,
}: {
  drive: drive_v3.Drive;
  driveActivity: driveactivity_v2.Driveactivity;
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  resourceId: string;
}) => {
  const fileActivityPromise = getDriveFileActivity({
    driveActivity: driveActivity,
    resourceId: resourceId,
    action: "RENAME",
  });
  const filePromise = drive.files.get({
    fileId: resourceId,
    fields: "*",
  });
  const [file, fileActivity] = await Promise.all([
    filePromise,
    fileActivityPromise,
  ]);
  if (file.data.mimeType !== "application/vnd.google-apps.folder")
    return {
      statusCode: 200,
      message: "File Change not processed, because it is a google drive folder",
    };
  const changes = fileActivity?.primaryActionDetail?.rename;
  if (!changes || !changes.newTitle || !changes.oldTitle)
    return {
      statusCode: 500,
      message: "No changes occured in folder/file",
    };
  const doc = await getDocuments({
    restApiUrl,
    apiKey,
    params: {
      projectName: changes.oldTitle,
    },
    addedRoute: "projects",
  });
  const newDoc = await updateDocument({
    restApiUrl,
    apiKey,
    data: {
      key: marshall(doc.data.pk, {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }),
      projectName: changes.newTitle,
    },
    addedRoute: "projects",
  });
  return newDoc;
};
