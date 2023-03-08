import axios from "axios";
export const deleteDocument = async ({
  restApiUrl,
  apiKey,
  params,
  addedRoute,
}: {
  restApiUrl: string;
  apiKey: string;
  params: { [key: string]: any };
  addedRoute: string;
}) =>
  await axios({
    method: "delete",
    url: `https://${restApiUrl}/${addedRoute}`,
    headers: {
      "x-api-key": apiKey,
    },
    params: params,
  });
