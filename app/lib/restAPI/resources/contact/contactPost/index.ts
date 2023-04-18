import { APIGatewayEvent } from "aws-lambda";
import { sendText } from "./sendText";
import { sendEmail } from "./sendEmail";
export type ContactMeInputProps = {
  sender: string;
  subject: string;
  message: string;
  type?: "phone" | "email";
};
export async function handler(e: APIGatewayEvent) {
  try {
    const body = e.body;
    const parsedBody = body ? JSON.parse(body) : {};
    const { sender, subject, message, type } =
      parsedBody as ContactMeInputProps;
    if (!sender || !subject || !message || !type) {
      return {
        statusCode: 400,
        body: "Missing required fields",
      };
    }
    if (type === "phone") return await sendText({ sender, subject, message });
    if (type === "email") return await sendEmail({ sender, subject, message });
    return {
      statusCode: 400,
      body: "Invalid type",
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
}