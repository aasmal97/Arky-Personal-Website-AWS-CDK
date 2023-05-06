import { deleteDocument } from "../../../crudRestApiMethods/deleteMethod";
import { deleteImgFromS3 } from "../../../general/s3Actions";
import { determineCategoryType } from "../determineCategoryType";
import { searchForFileByChildResourceId } from "../searchForFolder";
import { convertToStr } from "../../../general/convertToStr";
import { drive_v3 } from "googleapis";
const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
export const removeResource = async ({
  restApiUrl,
  apiKey,
  bucketName,
  resourceId,
  drive,
}: {
  drive: drive_v3.Drive;
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  resourceId: string;
}) => {
  const result = await searchForFileByChildResourceId(drive, resourceId, true);

  const category = await determineCategoryType({
    drive,
    fileData: result,
    topMostDirectoryFolderName: convertToStr(topMostDirectoryFolderName),
  });
  const resourceDetails = deleteDocument({
    restApiUrl,
    apiKey,
    addedRoute: category === "hobbies" ? "hobbies" : "projects/images",
    params: {
      googleResourceId: resourceId,
    },
  });
  const deleteObj = deleteImgFromS3(bucketName, resourceId);
  return await Promise.all([deleteObj, resourceDetails]);
};
