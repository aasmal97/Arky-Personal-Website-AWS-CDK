import * as dotenv from "dotenv";
import { unescapeNewLines } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { initalizeGoogleDrive } from "../../../../../../utils/google/googleDrive/initalizeGoogleDrive";
import { handler } from "./index";
import { APIGatewayEvent } from "aws-lambda";
dotenv.config();
const event: Omit<APIGatewayEvent, "resource" | "requestContext" | "pathParameters"> = {
  body: JSON.stringify({}),
  multiValueHeaders: {},
  httpMethod: "POST",
  isBase64Encoded: false,
  path: "/googleDrive",
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  stageVariables: null,
  headers: {
    "X-Goog-Resource-State": "update",
    Accept: "*/*",
    "User-Agent":
      "APIs-Google; (+https://developers.google.com/webmasters/APIs-Google.html)",
    "X-Forwarded-Proto": "https",
    "X-Goog-Channel-Token":
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb2xkZXJfaWQiOiIxYTloWE03WTFGU05GQXZwVk9Ld2tka0ltTlQ3TEc1MTciLCJ0b3Btb3N0X2RpcmVjdG9yeV9pZCI6IjFhOWhYTTdZMUZTTkZBdnBWT0t3a2RrSW1OVDdMRzUxNyJ9.96I0GNPQzRK4ND-0WBlsS77LTijQ45NMaPnfd_x32Ok",
    Host: "webhooks.api.arkyasmal.com",
    "Accept-Encoding": "gzip, deflate, br",
    "X-Goog-Message-Number": "99825",
    "X-Goog-Resource-URI":
      "https://www.googleapis.com/drive/v3/files/1a9hXM7Y1FSNFAvpVOKwkdkImNT7LG517?alt=json&fields=*",
    "X-Forwarded-Port": "443",
    "X-Amzn-Trace-Id": "Root=1-642367a8-19a420496cd94b9f2b4843cc",
    "X-Goog-Changed": "children",
    "X-Goog-Resource-ID": "xz-DL4LsJbvK75Fe7mjGu7CvqSY",
    "X-Goog-Channel-ID": "0c0f5e2f-4bb1-416b-ba6c-e5f4e3bf1361",
    "X-Forwarded-For": "66.102.6.234",
    "X-Goog-Channel-Expiration": "Wed, 29 Mar 2023 21:12:29 GMT",
  },
};
handler(event)
  .then((e) => console.log(e))
  .then((err) => console.error(err));
// const drive = initalizeGoogleDrive({
//   client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//   private_key: unescapeNewLines(
//     convertToStr(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
//   ),
// });
// drive.changes
//   .list({
//     pageToken: "75",
//   })
//   .then((e) => {
//     console.log(e.data.changes);
//   });
