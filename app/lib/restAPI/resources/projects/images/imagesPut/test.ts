import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";
dotenv.config();
axios({
  method: "put",
  url: "https://api.arkyasmal.com/projects/images",
  headers: {
    "x-api-key": process.env.AMAZON_REST_API_KEY,
  },
  data: {
    imgDescription: "filled",
    placeholderURL: "121312",
    googleResourceId: "213123",
    documentId: "213123",
  },
})
  .then((e) => console.log(e.data))
  .catch((err) => {
    const axErr = err as AxiosError;
    console.log(axErr.message, axErr.response?.data);
  });
