import { google } from "googleapis";
export const setUpOathClient = ({
  clientId,
  clientSecret,
  refreshToken,
}: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) => {
  const authClient = new google.auth.OAuth2(clientId, clientSecret);
  //this automatically refreshes access tokens
  authClient.setCredentials({
    refresh_token: refreshToken,
  });
  return authClient;
};
