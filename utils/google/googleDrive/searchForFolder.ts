import { drive_v3 } from "googleapis";
import { Blob } from "buffer";

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
  resourceId: string,
  download: boolean = true
) => {
  const fileResult = drive.files.get({
    fileId: resourceId,
    fields: "*",
  });
  const fileDownload = download
    ? drive.files.get(
        {
          fileId: resourceId,
          alt: "media",
          acknowledgeAbuse: true,
        },
        { responseType: "arraybuffer" }
      )
    : null;
  const [result, fileBlob] = await Promise.all([fileResult, fileDownload]);
  const file = result.data;
  const parents = file.parents;
  const fileBlobData = fileBlob ? (fileBlob.data as unknown) : null;
  const blob = fileBlobData
    ? new Blob([Buffer.from(fileBlobData as ArrayBuffer)])
    : null;
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
