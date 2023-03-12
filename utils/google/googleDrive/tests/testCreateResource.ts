import * as dotenv from "dotenv";
import { initalizeGoogleDrive } from "../initalizeGoogleDrive";
import { convertToStr } from "../../../general/convertToStr";
import { unescapeNewLines } from "../initalizeGoogleDrive";
import { createResource } from "../createResource";
dotenv.config();
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
createResource({
  restApiUrl: "hello",
  apiKey: "lol",
  bucketName: "nomatter",
  drive: drive,
  resourceId: "1M-VUFZ4tZvDtOU1WPaGe88YclNJR17Gu",
  vision: {
    apiEndpoint: convertToStr(process.env.AZURE_COMPUTER_VISION_API_ENDPOINT),
    apiKey: convertToStr(process.env.AZURE_COMPUTER_VISION_API_KEY),
  },
})
  .then((e) => console.log(e))
  .catch((err) => console.error(err));
