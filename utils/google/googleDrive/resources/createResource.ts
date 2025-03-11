import { drive_v3 } from "googleapis";
import { searchForFileByChildResourceId } from "../searchForFolder";
import { getDocuments } from "../../../crudRestApiMethods/getMethod";
import { putDocument } from "../../../crudRestApiMethods/putMethod";
import { resizeImg } from "../../../general/resizeImg";
import { uploadImgToS3 } from "../../../general/s3Actions";
import { getImgDescription } from "../../../azure/getImgDescription";
import { ProjectDocument } from "@restAPI/resources/utils/types/projectTypes";
import { corsHeaders } from "@restAPI/resources/utils/corsLambda";
import { determineCategoryType } from "../determineCategoryType";
import { convertToStr } from "../../../general/convertToStr";
const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
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
  const uploadFile = uploadImgToS3({
    bucketName,
    key: imgKey,
    body: fileBuffer,
  });
  const uploadPlaceholder = placeholderBuffer
    ? uploadImgToS3({
        bucketName,
        key: imgPlaceholderKey,
        body: placeholderBuffer,
      })
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
  result,
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
      headers: corsHeaders,
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
      placeholderURL: placeholderKey,
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
      placeholderURL: placeholderKey,
      height: result.file.imageMediaMetadata?.height,
      width: result.file.imageMediaMetadata?.width,
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
  const keyWithType = `${key}.${result.file.fileExtension}`;
  const placeholderKeyWithType = `${placeholderKey}.${result.file.fileExtension}`;
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
  const category = await determineCategoryType({
    drive,
    fileData: result,
    topMostDirectoryFolderName: convertToStr(topMostDirectoryFolderName),
  });
  //determine if its a hobbies directory
  //or a project directory
  let results: any;
  switch (category) {
    case "projects":
      results = await uploadToProjects({
        getImgDescriptionPromise,
        newPlaceholderBufferPromise,
        placeholderKey: placeholderKeyWithType,
        restApiUrl,
        apiKey,
        parentName,
        bucketName,
        fileBuffer,
        key: keyWithType,
        resourceId,
        result,
      });
      break;
    case "hobbies":
      results = await uploadToHobbies({
        getImgDescriptionPromise,
        newPlaceholderBufferPromise,
        placeholderKey: placeholderKeyWithType,
        restApiUrl,
        apiKey,
        bucketName,
        fileBuffer,
        key: keyWithType,
        result,
        resourceId,
      });
      break;
    default:
      return;
  }
  return results.map((result: any) => {
    const newObj = { ...result } as any;
    if (newObj["$metadata"]) delete newObj["$metadata"];
    if (newObj["$fault"]) delete newObj["$fault"];
    if (newObj.headers) delete newObj["headers"];
    if (newObj.request) delete newObj["request"];
    if (newObj.config) delete newObj["config"];
    if (newObj.request) delete newObj["request"];
    return newObj;
  });
};
