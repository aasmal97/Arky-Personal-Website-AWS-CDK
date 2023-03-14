import * as dotenv from "dotenv";
import { deleteWatchChannel } from "../../../../../../../utils/google/googleDrive/watchChannels/deleteWatchChannel";
import {
  initalizeGoogleDrive,
  unescapeNewLines,
} from "../../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { convertToStr } from "../../../../../../../utils/general/convertToStr";
dotenv.config();
const drive = initalizeGoogleDrive({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: unescapeNewLines(
    convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  ),
});
deleteWatchChannel({
  primaryKey: {
    topMostDirectory: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
    id: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517"
  },
  document: {
    topMostDirectory: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
    id: "5793c7c1-e636-430a-81ea-db5bf8b6755a",
    expiration: "1678905191000",
    kind: 'api#channel',
    resourceId: 'xz-DL4LsJbvK75Fe7mjGu7CvqSY',
    resourceUri: 'https://www.googleapis.com/drive/v3/files/1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517?alt=json&fields=*',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJfaWQiOiIxYTloWE03WTFGU05GQXZwVk9Ld2tka0ltTlQ3TEc1MTciLCJ0b3Btb3N0X2RpcmVjdG9yeV9pZCI6IjFhOWhYTTdZMUZTTkZBdnBWT0t3a2RrSW1OVDdMRzUxNyJ9.96I0GNPQzRK4ND-0WBlsS77LTijQ45NMaPnfd_x32Ok'
  },
  tableName: "WebhooksStack-activeWebhooksTable3FD26549-1DXOR533SEPLG",
  drive,
}).then((e) => console.log(e))
// createChannel({
//   folderId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
//   topMostDirectoryId: "1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517",
//   tableName: "WebhooksStack-activeWebhooksTable3FD26549-1DXOR533SEPLG",
//   drive,
//   tokenSecret: process.env.WEBHOOKS_API_TOKEN_SECRET,
//   domain: "webhooks.api.arkyasmal.com",
// }).then((e) => console.log(e)).catch((err)=> console.error(err));
