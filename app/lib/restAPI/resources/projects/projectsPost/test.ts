import axios, { AxiosError } from "axios";
import * as dotenv from 'dotenv'
dotenv.config()
axios({
  method: "post",
  url: "https://api.arkyasmal.com/projects",
  headers: {
    "x-api-key": process.env.AMAZON_REST_API_KEY,
  },
  data: {
    key: {
      recordType: "projects",
      startDate: "2023-03-09T23:22:07.000Z",
    },
    projectName: "adjust to 2",
  },
})
  .then((e) => console.log(e.data))
  .catch((err) => {
    const axErr = err as AxiosError;
    console.log(axErr.message, axErr.response?.data);
  });
