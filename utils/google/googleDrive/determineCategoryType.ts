import { drive_v3 } from "googleapis";
import { searchForFileByChildResourceId } from "./searchForFolder";
export const categoryTypes: {
  [key: string]: boolean;
} = {
  hobbies: true,
  projects: true,
};
export const determineCategoryType = async ({
  drive,
  topMostDirectoryFolderName,
  fileData,
}: {
  drive: drive_v3.Drive;
  topMostDirectoryFolderName: string;
  fileData: {
    file: drive_v3.Schema$File;
    fileBlob?: Blob | null;
    parents: null | drive_v3.Schema$File;
  };
}): Promise<string | undefined> => {
  //check current file
  const fileName = fileData.file.name;
  const fileType = fileData.file.mimeType;
  if (
    fileName &&
    fileName in categoryTypes &&
    fileType === "application/vnd.google-apps.folder"
  )
    return fileName;
  const name = fileData.parents?.name;
  //guard clause to stop
  if (name === topMostDirectoryFolderName) return topMostDirectoryFolderName;
  if (name && name in categoryTypes) return name;
  const parentsId = fileData.parents?.id;
  if (!parentsId) return topMostDirectoryFolderName;
  const result = await searchForFileByChildResourceId(drive, parentsId, false);
  return await determineCategoryType({
    drive,
    fileData: result,
    topMostDirectoryFolderName,
  });
};
