import * as dotenv from "dotenv";
import { initalizeGoogleDrive } from "../initalizeGoogleDrive";
import { unescapeNewLines } from "../initalizeGoogleDrive";
import { convertToStr } from "../../../general/convertToStr";
import { searchForFileByChildResourceId } from "../searchForFolder";
dotenv.config();
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
searchForFileByChildResourceId(drive, "1b6JtNVM5AYeb3LjgVzyTxbQsvFlF4UbC").then(
  (e) => console.log(e)
);
