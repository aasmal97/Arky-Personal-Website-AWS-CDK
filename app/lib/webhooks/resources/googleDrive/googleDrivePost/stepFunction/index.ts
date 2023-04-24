import { APIGatewayProxyResult } from "aws-lambda";
import { JwtPayload } from "jsonwebtoken";
import { modifyResources } from "../../../../../../../utils/google/googleDrive/resources/modifyResources";
type RequestEventProps = {
  resourceId: string;
  tokenPayload: JwtPayload;
};
export async function handler(e: string): Promise<APIGatewayProxyResult> {
  const request = JSON.parse(e) as RequestEventProps;
  return await modifyResources(request);
}
