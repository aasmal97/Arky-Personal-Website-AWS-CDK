import axios, { AxiosError } from "axios";
import * as dotenv from 'dotenv'
dotenv.config()
axios({
  method: "delete",
  url: "https://api.arkyasmal.com/hobbies",
  headers: {
    "x-api-key": process.env.AMAZON_REST_API_KEY,
  },
  params: {
    key: JSON.stringify({
      orientation: "vertical",
      dateCreated: "2023-03-09T23:22:07.000Z",
    }),
  },
})
  .then((e) => console.log(e.data))
  .catch((err) => {
    const axErr = err as AxiosError;
    console.log(axErr.message, axErr.response?.data);
  });
