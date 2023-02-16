import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { initalizeGoogleDrive } from "../../../../../../../utils/google/initalizeGoogleDrive";
import { drive_v3 } from "googleapis";
import { v4 as uuid } from "uuid";
import { getUnixTime, add } from "date-fns";
const convertToStr = (str: string | undefined) => {
  if (typeof str === "string") return str;
  else return "";
};
const identifyCorrectFolder = async (
  drive: drive_v3.Drive,
  arr: (string | null | undefined)[],
  matchName: string
) => {
  const promiseArr = arr.map((str) =>
    typeof str === "string"
      ? drive.files.get({
          fileId: str,
          fields: `files(id,parents,name)`,
        })
      : null
  );
  const results = await Promise.all(promiseArr);
  for (let r in results) {
    const currFile = results[r]?.data;
    if (!currFile) continue;
    if (currFile.name === matchName) return r;
  }
  return undefined;
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "PUT")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const drive = initalizeGoogleDrive();
  const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  const currDate = new Date();
  const endWatchDate = add(currDate, {
    days: 1,
  });
  //create a channel watch
  const folderName = convertToStr(process.env.GOOGLE_DRIVE_FOLDER_NAME);
  const result = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: "files(id,parents,name)",
  });
  const folders = result.data.files;
  if (!folders)
    return {
      statusCode: 500,
      body: `Folder called ${folderName} cannot be found`,
    };
  const correctIdx = await identifyCorrectFolder(
    drive,
    folders.map((e) => e.id),
    convertToStr(process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME)
  );
  if (correctIdx === undefined)
    return {
      statusCode: 500,
      body: `Folder called ${folderName} cannot be identified correctly`,
    };
  const folderId = folders[parseInt(correctIdx)].id;
  try {
    const watchRes = await drive.changes.watch({
      requestBody: {
        resourceId: folderId,
        id: uuid(),
        kind: "api#channel",
        token: process.env.WEBHOOKS_API_TOKEN,
        type: "web_hook",
        expiration: getUnixTime(endWatchDate).toString(),
        address: `https://${domainName}/googleDrive`,
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(watchRes),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
}
