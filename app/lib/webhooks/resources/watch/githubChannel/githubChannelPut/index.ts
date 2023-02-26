import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { getUnixTime, add } from "date-fns";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";

export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "PUT")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const domainName = convertToStr(process.env.WEBHOOKS_API_DOMAIN_NAME);
  const currDate = new Date();
  const endWatchDate = add(currDate, {
    hours: 13,
  });
  //create a channel watch
  const folderName = convertToStr(process.env.GOOGLE_DRIVE_FOLDER_NAME);

  try {
    // //get page token
    // const {
    //   data: { startPageToken },
    // } = await drive.changes.getStartPageToken();
    // //get watch changes
    // const watchRes = await drive.changes.watch({
    //   pageToken: convertToStr(startPageToken),
    //   requestBody: {
    //     // resourceId: folderId,
    //     id: uuid(),
    //     kind: "api#channel",
    //     token: process.env.WEBHOOKS_API_TOKEN,
    //     type: "web_hook",
    //     expiration: (getUnixTime(endWatchDate) * 1000).toString(),
    //     address: `https://${domainName}/github`,
    //   },
    // });
    return {
      statusCode: 200,
      // body: JSON.stringify(watchRes),
      body: ''
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
}
