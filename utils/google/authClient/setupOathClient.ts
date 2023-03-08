import { google } from "googleapis";
import {
  CredentialBody,
} from "google-auth-library";
export const setUpOathClient = ({
  credentials,
}: {
  credentials: CredentialBody | undefined;
}) => {
  const authClient = new google.auth.JWT(
    credentials?.client_email,
    undefined,
    credentials?.private_key,
    [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.activity",
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/cloud-vision",
    ],
    undefined
  );
  return authClient;
};
