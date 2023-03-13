import * as dotenv from "dotenv";
import { createChannel } from "./index";
import { unescapeNewLines } from "../../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
dotenv.config();
createChannel({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: unescapeNewLines(
      convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    ),
  },
  token: process.env.WEBHOOKS_API_TOKEN,
  domain: "webhooks.api.arkyasmal.com",
  parentFolder: process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME,
  folderName: process.env.GOOGLE_DRIVE_FOLDER_NAME,
}).then((e) => console.log(e));
