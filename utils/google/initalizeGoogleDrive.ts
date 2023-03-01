import { setUpOathClient } from "./setupOathClient";
import { google } from "googleapis";
import { CredentialBody } from "google-auth-library";

export const extractCredentialsObj = (creds?: string) => {
  if (!creds) return {};
  const startOfKey = "-----BEGIN PRIVATE KEY-----";
  const endOfKey = "-----END PRIVATE KEY-----";
  const matchRegex = new RegExp(`${startOfKey}(.*)${endOfKey}`, "gsm");
  const credsNoSpace = creds.replace(/\\"/g, `"`).replace(" ", "");
  const privateKey =
    credsNoSpace.match(matchRegex)?.[0].replace(/\\\n/g, "\n").replace(/\\n/g, '\n') + "\n";
  const credsNoLines = credsNoSpace.replace(/\\\n/g, "").replace(/\n/g, "");
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
