import { setUpOathClient } from "../authClient/setupOathClient";
import { google } from "googleapis";
import { CredentialBody } from "google-auth-library";
export const initalizeGoogleDriveActivity = (
  credentials: CredentialBody | undefined
) => {
  const authClient = setUpOathClient({
    credentials: credentials,
  });
  const drive = google.driveactivity({
    version: "v2",
    auth: authClient,
  });

  return drive;
};
