import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { validate } from "email-validator";
import { ContactMeInputProps } from ".";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { corsHeaders } from "../../utils/corsLambda";
import axios from "axios";
//we need to apply for app verification to use this
export const sendEmailUsingSes = async ({
  sender,
  subject,
  message,
}: ContactMeInputProps) => {
  const client = new SESClient({ region: "us-east-1" }); // Replace with your desired region
  const params = {
    Destination: {
      ToAddresses: [
        convertToStr(process.env.SES_EMAIL_ADDRESS), // Replace with the email address of the recipient
      ],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `<html><body><p>${message}</p></body></html>`, // Replace with the HTML content of your email
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject, // Replace with the subject of your email
      },
    },
    Source: sender, // Replace with the email address of the sender
  };
  const command = new SendEmailCommand(params);
  const response = await client.send(command);
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: `Succesfully sent email: ${response.MessageId}`,
  };
};
//we use send in blue since it doesnt rquire verification, just an account
export const sendEmailUsingSendInBlue = async ({
  sender,
  subject,
  message,
}: ContactMeInputProps) => {
  const url = "https://api.sendinblue.com/v3/smtp/email";
  const api_key = convertToStr(process.env.SEND_IN_BLUE_API_KEY);
  const payload = {
    sender: { email: sender },
    to: [{ email: convertToStr(process.env.SES_EMAIL_ADDRESS) }],
    subject: subject,
    htmlContent: `<html><body><p>${message}</p></body></html>`,
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
}: ContactMeInputProps) => {
  const isEmail = validate(sender);
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
