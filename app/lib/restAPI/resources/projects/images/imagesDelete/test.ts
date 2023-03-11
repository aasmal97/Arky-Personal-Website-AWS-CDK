import axios, { AxiosError } from "axios";
import * as dotenv from 'dotenv'
dotenv.config()
axios({
  method: "delete",
  url: "https://api.arkyasmal.com/projects/images",
  headers: {
    "x-api-key": process.env.AMAZON_REST_API_KEY,
  },
  params: {
    key: JSON.stringify({
      documentId: "234234",
      imgURL: "projects",
    }),
  },
})
  .then((e) => console.log(e.data))
  .catch((err) => {
    const axErr = err as AxiosError;
    console.log(axErr.message, axErr.response?.data);
  });
