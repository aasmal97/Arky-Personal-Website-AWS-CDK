import { setUpOathClient } from "./setupOathClient";
import { google } from "googleapis";
import { CredentialBody } from "google-auth-library";
// import * as dotenv from 'dotenv'
//   dotenv.config();
export const extractCredentialsObj = (creds?: string) => {
  if (!creds) return {};
  const startOfKey = "-----BEGIN PRIVATE KEY-----";
  const endOfKey = "-----END PRIVATE KEY-----";
  const matchRegex = new RegExp(`${startOfKey}(.*)${endOfKey}`, "gsm");
  const credsNoEscape = creds.replace(/\\"/g, `"`);
  const privateKey =
    credsNoEscape.match(matchRegex)?.[0].replace(/\\\n/g, "\n").replace(/\\n/g, '\n') + "\n";
  const credsNoLines = credsNoEscape.replace(/ /g, "").replace(/\\\n/g, "").replace(/\n/g, "");
  const subCred = credsNoLines.substring(1, credsNoLines.length - 1);
  const result = JSON.parse(subCred);
  result["private_key"] = privateKey;
  return result;
};
export const parseCredentialsVariable = (credentials?: string) => {
  let parsed: any;
  try {
    parsed = JSON.parse(typeof credentials === "string" ? credentials : "");
  } catch (e) {
    parsed = extractCredentialsObj(credentials);
  }
  return parsed;
};
export const initalizeGoogleDrive = (
  credentials: CredentialBody | undefined
) => {
  const authClient = setUpOathClient({
    credentials: credentials,
  });
  const drive = google.drive({
    version: "v3",
    auth: authClient,
  });
  return drive;
};
