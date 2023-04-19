import { sendEmailUsingSendInBlue, sendEmailUsingSes } from "./sendEmail";
import * as dotenv from "dotenv";
dotenv.config();
sendEmailUsingSendInBlue({
    sender: 'arkyasmal97@gmail.com',
    subject:"okay",
    message: "Hello"
}).then((res) => {
    console.log(res)
}).catch(err=> console.error(err))