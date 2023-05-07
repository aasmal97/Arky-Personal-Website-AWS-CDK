import { deleteDocument } from "../../../crudRestApiMethods/deleteMethod";
import { deleteImgFromS3 } from "../../../general/s3Actions";
import { determineCategoryType } from "../determineCategoryType";
import { searchForFileByChildResourceId } from "../searchForFolder";
import { convertToStr } from "../../../general/convertToStr";
import { drive_v3 } from "googleapis";
import { HobbiesDocument } from "../../../../app/lib/restAPI/resources/hobbies/hobbiesPut";
import { Image } from "../../../../app/lib/restAPI/resources/utils/types/projectTypes";
const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
export const removeResource = async ({
  restApiUrl,
  apiKey,
  bucketName,
  resource,
  drive,
}: {
  drive: drive_v3.Drive;
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  resource: Image | HobbiesDocument;
}) => {
  if (!resource.googleResourceId) return [];
  const result = await searchForFileByChildResourceId(
    drive,
    resource.googleResourceId
  );
  const category = await determineCategoryType({
    drive,
    fileData: result,
    topMostDirectoryFolderName: convertToStr(topMostDirectoryFolderName),
  });
  let key: string;
  let addedRoute: string;
  switch (category) {
    case "hobbies":
      const hobbiesResource = resource as HobbiesDocument;
      addedRoute = "hobbies";
      key = JSON.stringify({
        orientation: hobbiesResource.orientation,
        dateCreated: hobbiesResource.dateCreated,
      });
      break;
    case "projects":
      addedRoute = "projects/images";
      const projectImageResource = resource as Image;
      key = JSON.stringify({
        documentId: projectImageResource.documentId,
        googleResourceId: projectImageResource.googleResourceId,
      });
      break;
    default:
      return [];
  }
  const resourceDetails = deleteDocument({
    restApiUrl,
    apiKey,
    addedRoute,
    params: {
      key: key,
    },
  });
  const deleteImg = deleteImgFromS3(bucketName, resource.imgURL);
  const deletePlaceholderImg = deleteImgFromS3(
    bucketName,
    resource.placeholderURL
  );
  return await Promise.all([deleteImg, deletePlaceholderImg, resourceDetails]);
};
