import { drive_v3 } from "googleapis";
import { searchForFileByChildResourceId } from "./searchForFolder";
import { getDocuments } from "../../crudRestApiMethods/getMethod";
import { putDocument } from "../../crudRestApiMethods/putMethod";
import { resizeImg } from "../../general/resizeImg";
import { uploadImgToS3 } from "../../general/s3Actions";
import { getImgDescription } from "../../azure/getImgDescription";
import { ProjectDocument } from "../../../app/lib/restAPI/resources/types/projectTypes";
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
  //determine if its a hobbies directory
  //or a project directory
  const getDocResultsPromise =
    parentName !== "hobbies"
      ? getDocuments({
          restApiUrl,
          apiKey,
          addedRoute: "projects",
          params: {
            query: JSON.stringify({
              recordType: "projects",
              projectName: parentName,
            }),
          },
        })
      : "This is a hobbies image";
  const [docResults, imgDescription, newPlaceholderBuffer] = await Promise.all([
    getDocResultsPromise,
    getImgDescriptionPromise,
    newPlaceholderBufferPromise,
  ]);
  if (typeof docResults === "string")
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
    },
  });
};
