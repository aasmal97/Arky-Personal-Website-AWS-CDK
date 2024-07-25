import { validate } from "email-validator";
import { ContactFormSchemaType } from ".";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { corsHeaders } from "../../utils/corsLambda";
import axios from "axios";
//we use send in blue since it doesnt require verification, just an account
export const sendEmailUsingSendInBlue = async ({
  sender,
  subject,
  message,
}: ContactFormSchemaType) => {
  const url = "https://api.sendinblue.com/v3/smtp/email";
  const api_key = convertToStr(process.env.SEND_IN_BLUE_API_KEY);
  const payload = {
    sender: { email: sender.email },
    to: [{ email: convertToStr(process.env.SES_EMAIL_ADDRESS) }],
    subject: `[Arky's Portfolio Site - ${sender.name}] - ${subject}`,
    htmlContent: `<html><body><p>Name:<br>${
      sender.name
    }</p><br><p>Message:<br>${message}</p><br>${
      sender.phone ? `<p>Phone:<br>${sender.phone}</p>` : ""
    }</body></html>`,
  };
  const result = await axios({
    method: "post",
    url: url,
    headers: {
      "api-key": api_key,
    },
    data: payload,
  });
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: `Succesfully sent email: ${result.data.messageId}`,
  };
};
export const sendEmail = async ({
  sender,
  subject,
  message,
}: ContactFormSchemaType) => {
  const isEmail = validate(sender.email);
  if (!isEmail)
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: "Invalid email address",
    };
  try {
    return await sendEmailUsingSendInBlue({ sender, subject, message });
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: "Bad Request",
    };
  }
};
