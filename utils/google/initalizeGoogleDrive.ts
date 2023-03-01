import { setUpOathClient } from "./setupOathClient";
import { google } from "googleapis";
import { CredentialBody, ExternalAccountClientOptions } from 'google-auth-library';
export const parseCredentialsVariable = (credentials?: string) => {
  let parsed: any;
  try {
    parsed = JSON.parse(typeof credentials === "string" ? credentials : "");
  } catch (e) {
    const parseDopplerSecret =
      typeof credentials === "string" ? credentials.replace(/\\"/g, `"`) : `""`;
    const removeEnds = parseDopplerSecret.substring(
      1,
      parseDopplerSecret.length - 1
    );
    parsed = typeof credentials === "string" ? JSON.parse(removeEnds) : {};
  }
  return parsed;
};
export const initalizeGoogleDrive = (credentials: CredentialBody | undefined) => {
  const authClient = setUpOathClient({
    credentials: credentials,
  });
  const drive = google.drive({
    version: "v3",
    auth: authClient,
  });
  return drive;
};

