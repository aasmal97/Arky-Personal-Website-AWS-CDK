import { APIGatewayEvent } from "aws-lambda";
import { sendEmail } from "./sendEmail";
import { corsPostHeaders } from "@app/types";
import { z } from "zod";
import parsePhoneNumber, { AsYouType } from "libphonenumber-js";
export function isOnlyCountryCode(number: string) {
  const currNumber = new AsYouType();
  currNumber.input(number);
  const nationalNumber = currNumber.getNationalNumber();
  const result = nationalNumber.length > 0;
  return !result;
}
//zod schema validations
export const ContactFormNameSchema = z
  .string()
  .min(1, { message: "Name is required" });
export const ContactFormSubjectSchema = z
  .string()
  .min(1, { message: "Subject is required" });
export const ContactFormPhoneSchema = z
  .string()
  .transform((arg) => (!isOnlyCountryCode(arg) ? arg : undefined))
  .optional()
  .refine(
    (arg) => {
      if (!arg) return true;
      return parsePhoneNumber(arg)?.isValid();
    },
    {
      message: "Invalid phone number",
    }
  );
export const ContactFormEmailSchema = z
  .string()
  .email({ message: "Invalid email address" });
export const ContactFormMessageSchema = z
  .string()
  .min(10, { message: "Message should be >10 charaters long" });
export const ContactFormSchema = z.object({
  sender: z
    .object({
      name: ContactFormNameSchema,
      email: ContactFormEmailSchema,
      phone: ContactFormPhoneSchema,
    })
    .refine(
      (arg) => {
        return arg.email || arg.phone;
      },
      {
        message: "Either email or phone number is required",
      }
    ),
  subject: ContactFormSubjectSchema,
  message: ContactFormMessageSchema,
});

export type ContactFormSchemaType = z.infer<typeof ContactFormSchema>;
//handler
export async function handler(e: APIGatewayEvent) {
  try {
    const body = e.body;
    let parsedBody: any;
    try {
      parsedBody = body ? JSON.parse(body) : {};
    } catch (err) {
      return {
        statusCode: 400,
        headers: corsPostHeaders,
        body: "Invalid JSON",
      };
    }
    const validationResult = ContactFormSchema.safeParse(parsedBody);
    if (validationResult.error) {
      return {
        statusCode: 400,
        headers: corsPostHeaders,
        body: validationResult.error.errors[0].message,
      };
    }
    const { sender, subject, message } = validationResult.data;
    return await sendEmail({ sender, subject, message });
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsPostHeaders,
      body: JSON.stringify(err),
    };
  }
}
