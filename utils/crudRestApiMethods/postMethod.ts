import axios from "axios";
export const updateDocument = async ({
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
    method: "post",
    url: `https://${restApiUrl}/${addedRoute}`,
    headers: {
      "x-api-key": apiKey,
    },
    data: data,
  });
