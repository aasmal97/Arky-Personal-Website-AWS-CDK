import * as jwt from "jsonwebtoken";
import { convertToStr } from "../../utils/general/convertToStr";
const validateWehbookToken = (token?: string) => {
  if (!token)
    return {
      statusCode: 403,
      body: "Please provide a token. Access Denied",
    };
  const tokenSecret = process.env.WEBHOOKS_API_TOKEN_SECRET;
  const apiKey = process.env.WEBHOOKS_API_KEY;
  try {
    const decoded = jwt.verify(token, convertToStr(tokenSecret));
    if (
      typeof decoded === "string" ||
      (typeof decoded !== "string" && decoded.apiKey !== apiKey)
    ) {
      return {
        statusCode: 403,
        body: "Access is denied. Invalid api key or token",
      };
    }
  } catch (err) {
    return {
      statusCode: 403,
      body: "Access is denied",
    };
  }
  return true;
};
export default validateWehbookToken;
