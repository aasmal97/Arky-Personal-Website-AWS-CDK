import { sendEmailUsingSendInBlue } from "./sendEmail";
import * as dotenv from "dotenv";
dotenv.config();
sendEmailUsingSendInBlue({
  sender: {
    name: "Arky",
    email: "arkyasmal97@gmail.com",
  },
  subject: "okay",
  message: "Hello",
})
  .then((res) => {
    console.log(res);
  })
  .catch((err) => console.error(err));
