import * as dotenv from "dotenv";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
import { createChannel } from "../../../../../../../utils/google/googleDrive/watchChannels/createWatchChannel";
dotenv.config();
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
createChannel({
  folderId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
  topMostDirectoryId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
  tableName: "WebhooksStack-activeWebhooksTable3FD26549-1DXOR533SEPLG",
  drive,
  tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
  domain: "webhooks.api.arkyasmal.com",
}).then((e) => console.log(e)).catch((err)=> console.error(err));