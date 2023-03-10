import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import {
  WebhookEvent,
  RepositoryEvent,
  // PushEvent,
} from "@octokit/webhooks-types";
import { respondToRepositoryChanges } from "./repoActions";
// import { respondToPushChanges } from './pushActions';
const validateIncomingResponse = (e: APIGatewayEvent) => {
  if (e.httpMethod !== "POST")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const { "X-Hub-Signature": token } = e.headers;
  const secret = convertToStr(process.env.WEBHOOKS_API_TOKEN_SECRET);
  try {
    if (!token)
      return {
        statusCode: 403,
        body: "Please provide a token. Access Denied",
      };
    jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return {
      statusCode: 403,
      body: "Access is denied. Invalid token",
    };
  }

  return true;
};

export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const isValid = validateIncomingResponse(e);
  if (isValid !== true) isValid;
  if (!e.body)
    return {
      statusCode: 400,
      body: "Please provide a valid body",
    };
  const { "X-GitHub-Event": eventType } = e.headers;
  const data: WebhookEvent = JSON.parse(e.body);
  const restApiKey = convertToStr(process.env.AMAZON_REST_API_KEY);
  const restApiDomainName = convertToStr(
    process.env.AMAZON_REST_API_DOMAIN_NAME
  );
  let result: any
  switch (eventType) {
    case "repository":
      result = await respondToRepositoryChanges({
        data: data as RepositoryEvent,
        apiKey: restApiKey,
        restApiDomainName: restApiDomainName,
      });
    case "push":
      // await respondToPushChanges({
      //   data: data as PushEvent,
      //   apiKey: restApiKey,
      //   restApiDomainName,
      // });
    default:
      break;
  }
  try {
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Bad Request",
        error: e
      }),
    };
  }
}
