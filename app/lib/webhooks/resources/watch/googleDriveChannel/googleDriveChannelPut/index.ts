import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { v4 as uuid } from "uuid";
import { getUnixTime, add } from "date-fns";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
import { searchForWatchedResource } from "../../../../../../../utils/google/googleDrive/searchForWatchedResource";
import { CredentialBody } from "google-auth-library";
export const createChannel = async ({
  credentials,
  domain,
  token,
  folderName,
  parentFolder,
}: {
  credentials: CredentialBody;
  domain?: string;
  token?: string;
  folderName?: string;
  parentFolder?: string;
}) => {
  const drive = initalizeGoogleDrive(credentials);
  const domainName = convertToStr(domain);
  const currDate = new Date();
  const endWatchDate = add(currDate, {
    days: 4,
  });
  const folderId = await searchForWatchedResource({
    drive,
    folderName: convertToStr(folderName),
    parentFolder: convertToStr(parentFolder),
  });
  if (typeof folderId !== "string") return folderId;
  try {
    //get page token
    const {
      data: { startPageToken },
    } = await drive.changes.getStartPageToken();
    //get watch changes
    const watchRes = await drive.changes.watch({
      pageToken: convertToStr(startPageToken),
      fields: "*",
      requestBody: {
        resourceId: folderId,
        id: uuid(),
        //kind: "api#channel",
        token: token,
        type: "web_hook",
        expiration: (getUnixTime(endWatchDate) * 1000).toString(),
        address: `https://${domainName}/googleDrive`,
      },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(watchRes.data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "PUT")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  return await createChannel({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: unescapeNewLines(
        convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
      ),
    },
    token: process.env.WEBHOOKS_API_TOKEN,
    domain: process.env.WEBHOOKS_API_DOMAIN_NAME,
    parentFolder: process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME,
    folderName: process.env.GOOGLE_DRIVE_FOLDER_NAME
  });
}
