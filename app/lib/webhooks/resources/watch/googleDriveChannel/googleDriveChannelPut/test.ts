import * as dotenv from "dotenv";
import { refreshChannels } from ".";
dotenv.config();
refreshChannels()
  .then((e) => console.log(e))
  .catch((err) => console.error(err));
