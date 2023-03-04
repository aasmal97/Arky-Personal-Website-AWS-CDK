import { drive_v3 } from "googleapis";

export const searchForFolderByName = async (drive: drive_v3.Drive, folderName: string) => {
     const result = await drive.files.list({
       q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
       fields: "files(id,parents,name)",
     });
    const folders = result.data.files; 
    return folders
}