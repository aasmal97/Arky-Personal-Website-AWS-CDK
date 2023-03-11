import axios, { AxiosError } from "axios";
import * as dotenv from 'dotenv'
dotenv.config()
axios({
  method: "get",
  url: "https://api.arkyasmal.com/hobbies",
  headers: {
    "x-api-key": process.env.AMAZON_REST_API_KEY,
  },
  params: {
    query: JSON.stringify({
      orientation: "vertical",
    }),
    max: 1,
  },
})
  .then((e) => console.log(e.data))
  .catch((err) => {
    const axErr = err as AxiosError;
    console.log(axErr.message, axErr.response?.data);
  });
