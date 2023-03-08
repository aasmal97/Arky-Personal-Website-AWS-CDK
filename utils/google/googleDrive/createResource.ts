import { RequestProps } from "../../../app/lib/webhooks/resources/googleDrive/googleDrivePost";
import { drive_v3 } from "googleapis";
import { searchForFolderByChildResourceId } from "./searchForFolder";
import { getDocuments } from "../../crudRestApiMethods/getMethod";
import { putDocument } from "../../crudRestApiMethods/putMethod";
import { resizeImg } from "../../general/resizeImg";
import { uploadImgToS3 } from "../../general/s3Actions";
import { getImgDescription } from "../../azure/getImgDescription";
import { ProjectDocument } from "../../../app/lib/restAPI/resources/types/projectTypes";
// import * as dotenv from "dotenv";
// import { initalizeGoogleDrive } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
// import { convertToStr } from "../../../../../../utils/general/convertToStr";
// import { unescapeNewLines } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
// dotenv.config();
const uploadResourceItems = async ({
  restApiUrl,
  apiKey,
  doc,
  imgDescription,
  imgKey,
  imgPlaceholderKey,
  bucketName,
  fileBuffer,
  placeholderBuffer,
}: {
  restApiUrl: string;
  apiKey: string;
  doc: ProjectDocument;
  imgDescription: string;
  imgKey: string;
  imgPlaceholderKey: string;
  bucketName: string;
  fileBuffer: Buffer;
  placeholderBuffer?: Buffer | null;
}) => {
  const updateResults = putDocument({
    restApiUrl,
    apiKey,
    addedRoute: "projects/images",
    data: {
      documentId: doc.id,
      imgDescription: imgDescription,
      imgURL: imgKey,
      placeholderUrl: imgPlaceholderKey,
    },
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
  const result = await searchForFolderByChildResourceId(drive, resourceId);
  const parentName = result.parents?.name;
  const key = resourceId;
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
  const getDocResultsPromise = getDocuments({
    restApiUrl,
    apiKey,
    addedRoute: "projects",
    params: {
      query: {
        recordType: "projects",
        projectName: parentName,
      },
    },
  });
  const [docResults, imgDescription, newPlaceholderBuffer] = await Promise.all([
    getDocResultsPromise,
    getImgDescriptionPromise,
    newPlaceholderBufferPromise,
  ]);
  const doc = docResults.data.result.Items[0] as ProjectDocument;
  return await uploadResourceItems({
    restApiUrl,
    apiKey,
    doc,
    bucketName,
    fileBuffer: fileBuffer,
    imgKey: key,
    imgPlaceholderKey: placeholderKey,
    imgDescription: imgDescription,
    placeholderBuffer: newPlaceholderBuffer?.buffer,
  });
};
// const drive = initalizeGoogleDrive({
//   client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//   private_key: unescapeNewLines(
//     convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
//   ),
// });
// createResource({
//   restApiUrl: "hello",
//   apiKey: "lol",
//   bucketName: "nomatter",
//   drive: drive,
//   resourceId: "1M-VUFZ4tZvDtOU1WPaGe88YclNJR17Gu",
//   vision: {
//     apiEndpoint: convertToStr(process.env.AZURE_COMPUTER_VISION_API_ENDPOINT),
//     apiKey: convertToStr(process.env.AZURE_COMPUTER_VISION_API_KEY),
//   },
// })
//   .then((e) => console.log(e))
//   .catch((err) => console.error(err));
