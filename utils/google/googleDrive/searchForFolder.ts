import { drive_v3 } from "googleapis";
import { Blob } from "buffer";
// import * as dotenv from "dotenv";
// import { initalizeGoogleDrive } from "./initalizeGoogleDrive";
// import { unescapeNewLines } from "./initalizeGoogleDrive";
// import { convertToStr } from "../../general/convertToStr";
// dotenv.config();
export const searchForFolderByName = async (
  drive: drive_v3.Drive,
  folderName: string
) => {
  const result = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: "files(id,parents,name)",
  });
  const folders = result.data.files;
  return folders;
};
export const searchForFolderByChildResourceId = async (
  drive: drive_v3.Drive,
  resourceId: string
) => {
  const fileResult = drive.files.get({
    fileId: resourceId,
    fields: "*",
  });
  const fileDownload = drive.files.get(
    {
      fileId: resourceId,
      alt: "media",
      acknowledgeAbuse: true,
    },
    { responseType: "arraybuffer" }
  );
  const [result, fileBlob] = await Promise.all([fileResult, fileDownload]);
  const file = result.data;
  const parents = file.parents;
  const fileBlobData = fileBlob.data as unknown;
  const blob = new Blob([Buffer.from(fileBlobData as ArrayBuffer)])
  if (!parents)
    return {
      file: result.data,
      fileBlob: blob,
      parents: null,
    };
  const getParents = await drive.files.get({
    fileId: parents[0],
    fields: "*",
  });
  return {
    file: result.data,
    fileBlob: blob,
    parents: getParents.data,
  };
};
// const drive = initalizeGoogleDrive({
//   client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//   private_key: unescapeNewLines(
//     convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
//   ),
// });
// searchForFolderByChildResourceId(
//   drive,
//   "1b6JtNVM5AYeb3LjgVzyTxbQsvFlF4UbC"
// ).then((e) => console.log(e));
