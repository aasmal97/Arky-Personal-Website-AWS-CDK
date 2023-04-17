import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { validate } from "email-validator";
import { ContactMeInputProps } from ".";
import { convertToStr } from "../../../../../utils/general/convertToStr";
export const sendEmail = async ({
  sender,
  subject,
  message,
}: ContactMeInputProps) => {
  const isEmail = validate(sender);
  if (!isEmail)
    return {
      statusCode: 400,
      body: "Invalid email address",
    };
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
  try {
    const command = new SendEmailCommand(params);
    const response = await client.send(command);
    return {
      statusCode: 200,
      body: `Succesfully sent email: ${response.MessageId}`,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
};
