import { deleteDocument } from "@utils/crudRestApiMethods/deleteMethod";
import { deleteImgFromS3 } from "@utils/general/s3Actions";
import { determineCategoryType } from "../determineCategoryType";
import { searchForFileByChildResourceId } from "../searchForFolder";
import { convertToStr } from "@utils/general/convertToStr";
import { drive_v3 } from "googleapis";
import { HobbiesDocument } from "@app/types";
import { Image, isPDFDocument, PDFDocument } from "@app/types";
import { updateDocument } from "@utils/crudRestApiMethods/postMethod";
import { marshall } from "@aws-sdk/util-dynamodb";
const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
const cleanResult = (results: any[]) =>
  results.map((result) => {
    const newObj = { ...result } as any;
    if (newObj["$metadata"]) delete newObj["$metadata"];
    if (newObj["$fault"]) delete newObj["$fault"];
    if (newObj.headers) delete newObj["headers"];
    if (newObj.request) delete newObj["request"];
    if (newObj.config) delete newObj["config"];
    if (newObj.request) delete newObj["request"];
    return newObj;
  });
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
  resource: Image | HobbiesDocument | PDFDocument;
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
  if (isPDFDocument(resource)) {
    if (!resource.slidesURL || !resource.pk) return [];
    const resourceDetails = updateDocument({
      restApiUrl,
      apiKey,
      data: {
        key: marshall(resource.pk, {
          convertClassInstanceToMap: true,
          removeUndefinedValues: true,
        }),
        slidesURL: null,
        slidesGoogleResourceId: null,
        slidesFileName: null,
      },
      addedRoute: "projects",
    });
    const deleteFile = deleteImgFromS3(bucketName, resource.slidesURL);
    const results = await Promise.all([deleteFile, resourceDetails]);
    return cleanResult(results);
  }
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
  const results = await Promise.all([
    deleteImg,
    deletePlaceholderImg,
    resourceDetails,
  ]);
  return cleanResult(results);
};
