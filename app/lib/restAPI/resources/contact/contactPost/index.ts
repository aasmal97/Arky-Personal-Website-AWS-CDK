import { APIGatewayEvent } from "aws-lambda";
import { sendEmail } from "./sendEmail";
import { corsPostHeaders} from "../../utils/corsLambda";
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
        headers: corsPostHeaders,
        body: "Missing required fields",
      };
    }
    if (type === "email") return await sendEmail({ sender, subject, message });
    return {
      statusCode: 400,
      headers: corsPostHeaders,
      body: "Invalid type",
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsPostHeaders,
      body: JSON.stringify(err),
    };
  }
}
