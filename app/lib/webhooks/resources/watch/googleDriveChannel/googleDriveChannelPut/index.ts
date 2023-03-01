import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { initalizeGoogleDrive } from "../../../../../../../utils/google/initalizeGoogleDrive";
import { drive_v3 } from "googleapis";
import { v4 as uuid } from "uuid";
import { getUnixTime, add } from "date-fns";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
const identifyCorrectFolder = async (
  drive: drive_v3.Drive,
  arr: (string | null | undefined)[],
  matchName: string
) => {
  const promiseArr = arr.map((str) =>
    typeof str === "string"
      ? drive.files.get({
          fileId: str,
          fields: "id,parents,name",
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
  const drive = initalizeGoogleDrive(
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
  );
  console.log(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
  const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  const currDate = new Date();
  const endWatchDate = add(currDate, {
    hours: 13,
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
  const parentIds = folders.map((e) => (e.parents ? e.parents[0] : null));
  const correctIdx = await identifyCorrectFolder(
    drive,
    parentIds,
    convertToStr(process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME)
  );
  if (correctIdx === undefined)
    return {
      statusCode: 500,
      body: `Folder called ${folderName} cannot be identified correctly`,
    };
  const folderId = folders[parseInt(correctIdx)].id;
  try {
    //get page token
    const {
      data: { startPageToken },
    } = await drive.changes.getStartPageToken();
    //get watch changes
    const watchRes = await drive.changes.watch({
      pageToken: convertToStr(startPageToken),
      requestBody: {
        resourceId: folderId,
        id: uuid(),
        kind: "api#channel",
        token: process.env.WEBHOOKS_API_TOKEN,
        type: "web_hook",
        expiration: (getUnixTime(endWatchDate) * 1000).toString(),
        address: `https://${domainName}/googleDrive`,
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(watchRes),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
}

