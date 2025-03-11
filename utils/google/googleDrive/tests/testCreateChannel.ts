import * as dotenv from "dotenv";
import { initalizeGoogleDrive } from "../initalizeGoogleDrive";
import { convertToStr } from "@utils/general/convertToStr";
import { unescapeNewLines } from "../initalizeGoogleDrive";
import { createChannel } from "../watchChannels/createWatchChannel";
dotenv.config();
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
createChannel({
  tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
  domain: process.env.WEBHOOKS_API_DOMAIN_NAME,
  drive,
  tableName: convertToStr(process.env.WEBHOOKS_DYNAMO_DB_TABLE_NAME),
  topMostDirectoryId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
  parentDirectoryId: "14EMSpiQ0GHcTBCEC-4qbVvjcbjQDASTI",
  folderId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
})
  .then((e) => console.log(e))
  .catch((err) => console.error(err));
