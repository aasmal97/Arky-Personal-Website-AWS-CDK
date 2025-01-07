import { handler } from "./";
import * as dotenv from "dotenv";
dotenv.config();
handler()
  .then((res) => {
    console.log(res);
  })
  .catch((err) => console.error(err));
