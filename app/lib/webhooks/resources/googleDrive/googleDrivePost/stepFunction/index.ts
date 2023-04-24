import { APIGatewayProxyResult } from "aws-lambda";
import { JwtPayload } from "jsonwebtoken";
import { modifyResources } from "../../../../../../../utils/google/googleDrive/resources/modifyResources";
type RequestEventProps = {
  resourceId: string;
  tokenPayload: JwtPayload;
};
export async function handler(
  e: string | RequestEventProps
): Promise<APIGatewayProxyResult> {
  const request =
    typeof e === "string" ? (JSON.parse(e) as RequestEventProps) : e;
  return await modifyResources(request);
}
