import * as dotenv from 'dotenv'
import { unescapeNewLines } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { initalizeGoogleDrive } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
dotenv.config()
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
drive.changes
  .list({
    pageToken: "75",
  })
  .then((e) => {
    console.log(e.data.changes);
  });
