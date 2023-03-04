import { setUpOathClient } from "../setupOathClient";
import { google } from "googleapis";
import { CredentialBody } from "google-auth-library";
export const initalizeGoogleDrive = (
  credentials: CredentialBody | undefined
) => {
  const authClient = setUpOathClient({
    credentials: credentials,
  });
  const vision = google.vision({
    version: "v1",
    auth: authClient,
  });
  return vision;
};
