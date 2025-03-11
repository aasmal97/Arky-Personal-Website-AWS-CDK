import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { convertToStr } from "@utils/general/convertToStr";
import validateWehbookToken from "@utils/general/validateWebookTokens";
import { isAPIGatewayResult } from "@utils/general/isApiGatewayResult";
import { JwtPayload } from "jsonwebtoken";
// Import the required AWS SDK clients and commands
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
//import { modifyResources } from "@utils/google/googleDrive/resources/modifyResources";
export type RequestProps = {
  tokenPayload: JwtPayload;
  resourceId: string;
  resourceURI: string;
  state: string;
  contentChanged: string;
  body: { [key: string]: any };
};
const validateRequest = (
  e: Omit<APIGatewayEvent, "resource" | "requestContext" | "pathParameters">
): RequestProps | APIGatewayProxyResult => {
  if (e.httpMethod !== "POST")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const headers = e.headers;
  const {
    "X-Goog-Channel-Token": token,
    "X-Goog-Resource-URI": resourceURI,
    "X-Goog-Resource-State": state,
    "X-Goog-Changed": contentChanged,
  } = headers;
  const tokenIsValid = validateWehbookToken(token);
  if (isAPIGatewayResult(tokenIsValid)) return tokenIsValid;

  return {
    tokenPayload: tokenIsValid,
    resourceId: convertToStr(tokenIsValid.folder_id),
    resourceURI: convertToStr(resourceURI),
    state: convertToStr(state),
    contentChanged: convertToStr(contentChanged),
    body: e.body ? JSON.parse(e.body) : {},
  };
};
export async function handler(
  e: Omit<APIGatewayEvent, "resource" | "requestContext" | "pathParameters">
): Promise<APIGatewayProxyResult> {
  const request = validateRequest(e);
  if (isAPIGatewayResult(request)) return request;
  const { resourceId, state, contentChanged, tokenPayload } = request;
  if (state === "sync")
    return {
      statusCode: 200,
      body: "Webhook connection recieved",
    };
  const supportedStates: {
    [key: string]: any;
  } = {
    update: "children",
    trash: "",
    remove: "",
    trashed: "",
  };
  if (!(state in supportedStates) || supportedStates[state] !== contentChanged)
    return {
      statusCode: 200,
      body: JSON.stringify({
        state: state,
        contentChanged: contentChanged,
        message: "This webhook does not handle this type of notification yet",
      }),
    };

  // Set the AWS Region and create an instance of the Step Functions client
  const REGION = "us-east-1";
  const sfnClient = new SFNClient({ region: REGION });

  // Define the input payload for the state machine
  const input = {
    resourceId,
    tokenPayload,
  };
  // Define the ARN of the state machine to execute
  const stateMachineArn = process.env.GOOGLE_DRIVE_POST_STATE_MACHINE_ARN;

  // Create a new StartExecutionCommand with the input payload and state machine ARN
  const startExecutionCommand = new StartExecutionCommand({
    stateMachineArn: stateMachineArn,
    input: JSON.stringify(input),
  });

  // Call the Step Functions API to start the execution of the state machine
  const response = await sfnClient.send(startExecutionCommand);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "State Machine for modifiying resources has started",
      response: response,
    }),
  };
}
