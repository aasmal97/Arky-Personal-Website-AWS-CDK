import { searchForFolderByName } from "../searchForFolder";
import identifyCorrectFolder from "../identifyCorrectFolder";
import { drive_v3 } from "googleapis";
export const searchForWatchedResource = async ({
  drive,
  folderName,
  parentFolder,
}: {
  drive: drive_v3.Drive;
  folderName: string;
  parentFolder: string;
}) => {
  const folders = await searchForFolderByName(drive, folderName);
  if (!folders)
    return {
      statusCode: 500,
      body: `Folder called ${folderName} cannot be found`,
    };
  const parentIds = folders.map((e) => (e.parents ? e.parents[0] : null));
  const correctIdx = await identifyCorrectFolder(
    drive,
    parentIds,
    parentFolder
  );
  if (correctIdx === undefined)
    return {
      statusCode: 500,
      body: `Folder called ${folderName} cannot be identified correctly`,
    };
  const folderId = folders[parseInt(correctIdx)].id;
  return folderId ? folderId : {
    statusCode: 500, 
    body: `Folder called ${folderName} cannot be identified correctly`,
  }
};