import { drive_v3 } from "googleapis";
import { searchForFileByChildResourceId } from "../searchForFolder";
import { getDocuments } from "../../../crudRestApiMethods/getMethod";
import { putDocument } from "../../../crudRestApiMethods/putMethod";
import { resizeImg } from "../../../general/resizeImg";
import { uploadImgToS3 } from "../../../general/s3Actions";
import { getImgDescription } from "../../../azure/getImgDescription";
import { ProjectDocument } from "../../../../app/lib/restAPI/resources/types/projectTypes";
const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
const categoryTypes: {
  [key: string]: boolean;
} = {
  hobbies: true,
  projects: true,
};
const determineCategoryType = async (
  drive: drive_v3.Drive,
  e: {
    file: drive_v3.Schema$File;
    fileBlob: Blob | null;
    parents: null | drive_v3.Schema$File;
  }
): Promise<string | undefined> => {
  //check current file
  const fileName = e.file.name;
  const fileType = e.file.mimeType;
  if (
    fileName &&
    fileName in categoryTypes &&
    fileType === "application/vnd.google-apps.folder"
  )
    return fileName;
  const name = e.parents?.name;
  //guard clause to stop
  if (name === topMostDirectoryFolderName) return topMostDirectoryFolderName;
  if (name && name in categoryTypes) return name;
  const parentsId = e.parents?.id;
  if (!parentsId) return topMostDirectoryFolderName;
  const result = await searchForFileByChildResourceId(drive, parentsId, false);
  return await determineCategoryType(drive, result);
};
const uploadResourceItems = async ({
  restApiUrl,
  apiKey,
  data,
  imgKey,
  imgPlaceholderKey,
  bucketName,
  fileBuffer,
  placeholderBuffer,
  addedRoute,
}: {
  restApiUrl: string;
  apiKey: string;
  imgKey: string;
  imgPlaceholderKey: string;
  bucketName: string;
  fileBuffer: Buffer;
  placeholderBuffer?: Buffer | null;
  data: { [key: string]: any };
  addedRoute: string;
}) => {
  const updateResults = putDocument({
    restApiUrl,
    apiKey,
    addedRoute,
    data: data,
  });
  const uploadFile = uploadImgToS3(bucketName, imgKey, new Blob([fileBuffer]));
  const uploadPlaceholder = placeholderBuffer
    ? uploadImgToS3(
        bucketName,
        imgPlaceholderKey,
        new Blob([placeholderBuffer])
      )
    : null;
  const promiseArr = await Promise.all([
    uploadFile,
    updateResults,
    uploadPlaceholder,
  ]);
  return promiseArr;
};
const uploadToProjects = async ({
  restApiUrl,
  apiKey,
  parentName,
  getImgDescriptionPromise,
  newPlaceholderBufferPromise,
  bucketName,
  fileBuffer,
  key,
  placeholderKey,
  resourceId,
  result
}: {
  restApiUrl: string;
  apiKey: string;
  parentName: string | undefined | null;
  getImgDescriptionPromise: Promise<any>;
  newPlaceholderBufferPromise: Promise<any>;
  bucketName: string;
  fileBuffer: Buffer;
  key: string;
  placeholderKey: string;
  resourceId: string;
  result: {
    file: drive_v3.Schema$File;
    fileBlob: Blob | null;
    parents: null | drive_v3.Schema$File;
  };
}) => {
  const getDocResultsPromise = getDocuments({
    restApiUrl,
    apiKey,
    addedRoute: "projects",
    params: {
      query: JSON.stringify({
        recordType: "projects",
        projectName: parentName,
      }),
    },
  });
  const [docResults, imgDescription, newPlaceholderBuffer] = await Promise.all([
    getDocResultsPromise,
    getImgDescriptionPromise,
    newPlaceholderBufferPromise,
  ]);
  //continue if a project doc
  const docItems = docResults?.data?.result?.Items;
  if (!docItems || docItems.length <= 0)
    return {
      statusCode: 200,
      message: `No relevant project found with the following name: ${parentName}`,
    };
  const doc = docItems[0] as ProjectDocument;
  return await uploadResourceItems({
    restApiUrl,
    apiKey,
    bucketName,
    fileBuffer: fileBuffer,
    imgKey: key,
    imgPlaceholderKey: placeholderKey,
    placeholderBuffer: newPlaceholderBuffer?.buffer,
    addedRoute: "projects/images",
    data: {
      documentId: doc.id,
      imgDescription: imgDescription,
      imgURL: key,
      placeholderUrl: placeholderKey,
      googleResourceId: resourceId,
      name: result.file.name,
    },
  });
};
const uploadToHobbies = async ({
  getImgDescriptionPromise,
  newPlaceholderBufferPromise,
  restApiUrl,
  apiKey,
  bucketName,
  fileBuffer,
  key,
  placeholderKey,
  result,
  resourceId,
}: {
  restApiUrl: string;
  apiKey: string;
  getImgDescriptionPromise: Promise<any>;
  newPlaceholderBufferPromise: Promise<any>;
  bucketName: string;
  fileBuffer: Buffer;
  key: string;
  placeholderKey: string;
  resourceId: string;
  result: {
    file: drive_v3.Schema$File;
    fileBlob: Blob | null;
    parents: null | drive_v3.Schema$File;
  };
}) => {
  const [imgDescription, newPlaceholderBuffer] = await Promise.all([
    getImgDescriptionPromise,
    newPlaceholderBufferPromise,
  ]);
  return await uploadResourceItems({
    restApiUrl,
    apiKey,
    bucketName,
    fileBuffer: fileBuffer,
    imgKey: key,
    imgPlaceholderKey: placeholderKey,
    placeholderBuffer: newPlaceholderBuffer?.buffer,
    addedRoute: "hobbies",
    data: {
      name: result.file.name,
      imgDescription: imgDescription,
      imgURL: key,
      googleResourceId: resourceId,
      placeholderUrl: placeholderKey,
      width: result.file.imageMediaMetadata?.height,
      height: result.file.imageMediaMetadata?.width,
    },
  });
};
export const createResource = async ({
  restApiUrl,
  apiKey,
  bucketName,
  drive,
  resourceId,
  vision,
}: {
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  drive: drive_v3.Drive;
  resourceId: string;
  vision: {
    apiEndpoint: string;
    apiKey: string;
  };
}) => {
  const result = await searchForFileByChildResourceId(drive, resourceId, true);
  const parentName = result.parents?.name;
  const key = `${parentName}/${resourceId}/image`;
  const placeholderKey = `${key}-placeholder`;
  const fileBuffer = result.fileBlob
    ? Buffer.from(await result.fileBlob.arrayBuffer())
    : null;
  if (!fileBuffer) return;
  const imageWidth = result.file.imageMediaMetadata?.width;
  const newPlaceholderBufferPromise = resizeImg({
    mimeType: result.file.mimeType,
    fileBuffer,
    width:
      (!imageWidth && imageWidth !== 0) || imageWidth > 100 ? 100 : imageWidth,
  });
  const getImgDescriptionPromise = getImgDescription({
    mimeType: result.file.mimeType,
    buffer: fileBuffer,
    imgWidth:
      (!imageWidth && imageWidth !== 0) || imageWidth > 400 ? 400 : imageWidth,
    vision,
  });
  const category = await determineCategoryType(drive, result);
  //determine if its a hobbies directory
  //or a project directory
  switch (category) {
    case "projects":
      return await uploadToProjects({
        restApiUrl,
        apiKey,
        parentName,
        getImgDescriptionPromise,
        newPlaceholderBufferPromise,
        bucketName,
        fileBuffer,
        key,
        placeholderKey,
        resourceId,
        result
      });
    case "hobbies":
      return await uploadToHobbies({
        getImgDescriptionPromise,
        newPlaceholderBufferPromise,
        restApiUrl,
        apiKey,
        bucketName,
        fileBuffer,
        key,
        placeholderKey,
        result,
        resourceId,
      });
    default:
      return;
  }
};
