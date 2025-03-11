import { drive_v3 } from "googleapis";
import { searchForFileByChildResourceId } from "../searchForFolder";
import { determineCategoryType } from "../determineCategoryType";
import { convertToStr } from "@utils/general/convertToStr";
import { getDocuments } from "@utils/crudRestApiMethods/getMethod";
import { ProjectDocument } from "@app/types";
import { corsHeaders } from "@restAPI/resources/utils/corsLambda";
import { uploadImgToS3 } from "@utils/general/s3Actions";
import { updateDocument } from "@utils/crudRestApiMethods/postMethod";
import { marshall } from "@aws-sdk/util-dynamodb";

export type CreatePDFResourceProps = {
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  drive: drive_v3.Drive;
  resourceId: string;
};
export type UploadProjectDocumentProps = {
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  fileBuffer: Buffer;
  key: string;
  resourceId: string;
  parentName: string | undefined | null;
  result: {
    file: drive_v3.Schema$File;
    fileBlob: Blob | null;
    parents: null | drive_v3.Schema$File;
  };
};

const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
const uploadPDFResourceItems = async ({
  restApiUrl,
  apiKey,
  fileKey,
  resourceId,
  bucketName,
  fileBuffer,
  addedRoute,
  data,
  result,
}: Pick<
  UploadProjectDocumentProps,
  | "restApiUrl"
  | "apiKey"
  | "fileBuffer"
  | "bucketName"
  | "resourceId"
  | "result"
> & {
  data: ProjectDocument;
  fileKey: string;
  addedRoute: string;
}) => {
  const updateResult = updateDocument({
    restApiUrl,
    apiKey,
    data: {
      key: marshall(data.pk, {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      }),
      slidesURL: fileKey,
      slidesGoogleResourceId: resourceId,
      slidesFileName: result.file.name,
    },
    addedRoute: addedRoute,
  });

  //this actually uploads a file to s3, not just images
  const uploadFile = uploadImgToS3({
    bucketName,
    key: fileKey,
    body: fileBuffer,
  });
  const promiseArr = await Promise.all([uploadFile, updateResult]);
  return promiseArr;
};
const uploadToProjects = async ({
  restApiUrl,
  apiKey,
  parentName,
  bucketName,
  fileBuffer,
  key,
  resourceId,
  result,
}: UploadProjectDocumentProps) => {
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
  const [docResults] = await Promise.all([getDocResultsPromise]);
  //continue if a project doc
  const docItems = docResults?.data?.result?.Items;
  if (!docItems || docItems.length <= 0)
    return {
      statusCode: 200,
      headers: corsHeaders,
      message: `No relevant project found with the following name: ${parentName}`,
    };
  const doc = docItems[0] as ProjectDocument;
  return await uploadPDFResourceItems({
    restApiUrl,
    apiKey,
    bucketName,
    fileBuffer: fileBuffer,
    addedRoute: "projects",
    fileKey: key,
    resourceId,
    data: doc,
    result,
  });
};

export const createPDFResource = async ({
  restApiUrl,
  apiKey,
  bucketName,
  drive,
  resourceId,
}: CreatePDFResourceProps) => {
  const result = await searchForFileByChildResourceId(drive, resourceId, true);
  const parentName = result.parents?.name;
  const key = `${parentName}/${resourceId}/pdf`;
  const keyWithType = `${key}.${result.file.fileExtension}`;
  const fileBuffer = result.fileBlob
    ? Buffer.from(await result.fileBlob.arrayBuffer())
    : null;
  if (!fileBuffer) return;
  const category = await determineCategoryType({
    drive,
    fileData: result,
    topMostDirectoryFolderName: convertToStr(topMostDirectoryFolderName),
  });
  let results: any;
  switch (category) {
    case "projects":
      results = await uploadToProjects({
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
