import { google } from "googleapis";
import { CredentialBody, ExternalAccountClientOptions } from "google-auth-library";
export const setUpOathClient = ({
  credentials,
}: {
  credentials: CredentialBody | ExternalAccountClientOptions | undefined;
}) => {
  const authClient = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return authClient;
};
