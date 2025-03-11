import * as dotenv from "dotenv";
import { createWatchChannels } from ".";
dotenv.config();
createWatchChannels().then((e) => {
  console.log(e)
});