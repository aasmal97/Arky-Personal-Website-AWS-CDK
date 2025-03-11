import * as dotenv from "dotenv";
import { initalizeGoogleDrive } from "../initalizeGoogleDrive";
import { convertToStr } from "@utils/general/convertToStr";
import { unescapeNewLines } from "../initalizeGoogleDrive";
import { createResource } from "../resources/createResource";
dotenv.config();
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
createResource({
  restApiUrl: convertToStr(process.env.AMAZON_REST_API_URL),
  apiKey: convertToStr(process.env.AMAZON_REST_API_KEY),
  bucketName: convertToStr(process.env.S3_MEDIA_FILES_BUCKET_NAME),
  drive: drive,
  resourceId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
  vision: {
    apiEndpoint: convertToStr(process.env.AZURE_COMPUTER_VISION_API_ENDPOINT),
    apiKey: convertToStr(process.env.AZURE_COMPUTER_VISION_API_KEY),
  },
})
  .then((e) => console.log(e))
  .catch((err) => console.error(err));
