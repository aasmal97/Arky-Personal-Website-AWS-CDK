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
      orientation: "horizontal",
      dateCreated: "2023-03-11T21:03:18.327Z",
    }),
  },
})
  .then((e) => console.log(e.data))
  .catch((err) => {
    const axErr = err as AxiosError;
    console.log(axErr.message, axErr.response?.data);
  });
