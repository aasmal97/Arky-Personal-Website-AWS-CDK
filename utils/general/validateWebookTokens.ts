import * as jwt from "jsonwebtoken";
import { convertToStr } from "../../utils/general/convertToStr";
const validateWehbookToken = (token?: string) => {
  if (!token)
    return {
      statusCode: 403,
      body: "Please provide a token. Access Denied",
    };
  const tokenSecret = process.env.WEBHOOKS_API_TOKEN_SECRET;
  try {
    const decoded = jwt.verify(token, convertToStr(tokenSecret), {
      algorithms: ["HS256"],
    });
    if (typeof decoded === "string")
      return {
        statusCode: 403,
        body: "Access is denied. Invalid  token",
      };
    return decoded;
  } catch (err) {
    return {
      statusCode: 403,
      body: "Access is denied. Invalid  token",
    };
  }
};
export default validateWehbookToken;
