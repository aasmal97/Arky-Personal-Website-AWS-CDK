import { modifyResources } from "../../../../../../../utils/google/googleDrive/resources/modifyResources";
import * as dotenv from "dotenv";
dotenv.config();
const input = {
  resourceId: "1Ieo5M80Fvwz4qepvntn4edByqHNfw_AA",
  tokenPayload: {
    folder_id: "1Ieo5M80Fvwz4qepvntn4edByqHNfw_AA",
    topmost_directory_id: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
  },
};
modifyResources(input)
  .then((e) => console.log(e))
  .catch((e) => console.log(e));
