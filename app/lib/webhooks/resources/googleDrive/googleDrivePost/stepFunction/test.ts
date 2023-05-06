import { modifyResources } from "../../../../../../../utils/google/googleDrive/resources/modifyResources";
import * as dotenv from "dotenv";
dotenv.config();
// const input = {
//   resourceId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
//   tokenPayload: {
//     folder_id: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
//     topmost_directory_id: "14EMSpiQ0GHcTBCEC-4qbVvjcbjQDASTI",
//   },
// };
const input = {
  "resourceId": "1XmCMgq-JfcNNRH7fEzXWDGXV3UEOY5YC",
  "tokenPayload": {
    "folder_id": "1XmCMgq-JfcNNRH7fEzXWDGXV3UEOY5YC",
    "topmost_directory_id": "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517"
  }
}
modifyResources(input)
  .then((e) => console.log(e))
  .catch((e) => console.log(e));
