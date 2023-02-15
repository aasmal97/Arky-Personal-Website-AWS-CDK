import { setUpOathClient } from "./setupOathClient";
import { google } from "googleapis";
const convertToStr = (str: string | undefined) => {
  if (typeof str === "string") return str;
  else return "";
};
export const initalizeGoogleDrive = () => {
  const authClient = setUpOathClient({
    clientId: convertToStr(process.env.GOOGLE_CLIENT_ID),
    clientSecret: convertToStr(process.env.GOOGLE_CLIENT_SECRET),
    refreshToken: convertToStr(process.env.GOOGLE_REFRESH_TOKEN),
  });
  const drive = google.drive({
    version: "v3",
    auth: authClient,
  });
  return drive;
};
