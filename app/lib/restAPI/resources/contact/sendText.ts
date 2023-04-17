import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { ContactMeInputProps } from ".";
import parsePhoneNumber from "libphonenumber-js";
export const isPhoneNumber = (phoneNumber: string) => {
  const newNumber = parsePhoneNumber(phoneNumber, "US");
  if (!newNumber) return false;
  // replace with the phone number you want to verify
  const isValid = newNumber.isValid();
  const isPossible = newNumber.isPossible();
  return isValid && isPossible;
};
export const sendText = async ({
  sender,
  message,
  subject,
}: ContactMeInputProps) => {
  if (!isPhoneNumber(sender))
    return {
      statusCode: 400,
      body: "Invalid Phone Number",
    };
  const snsClient = new SNSClient({ region: "us-east-1" }); // Replace YOUR_REGION with your AWS region
  const params = {
    Message: `Subject: ${subject} \n Message: \n ${message} \n Contact: ${sender}`, // Replace YOUR_MESSAGE with the message you want to send
    PhoneNumber: process.env.SNS_PHONE_NUMBER, // Replace YOUR_PHONE_NUMBER with the recipient's phone number
  };
  const command = new PublishCommand(params);
  try {
    const response = await snsClient.send(command);
    return {
      statusCode: 200,
      body: `Succesfully sent message: ${response.MessageId}`,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Bad Request",
    };
  }
};
