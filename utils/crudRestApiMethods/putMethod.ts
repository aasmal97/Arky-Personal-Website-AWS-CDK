import axios from "axios";
export const putDocument = async ({
  restApiUrl,
  apiKey,
  data,
  addedRoute,
}: {
  restApiUrl: string;
  apiKey: string;
  data: { [key: string]: any };
  addedRoute: string;
}) =>
  await axios({
    method: "put",
    url: `https://${restApiUrl}/${addedRoute}`,
    headers: {
      "x-api-key": apiKey,
    },
    data: data,
  });
