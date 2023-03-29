import { APIGatewayProxyResult } from "aws-lambda";
import { JwtPayload } from "jsonwebtoken";
import { modifyResources } from "../../../../../utils/google/googleDrive/resources/modifyResources";
export async function handler({
  resourceId,
  tokenPayload,
}: {
  resourceId: string;
  tokenPayload: JwtPayload;
}): Promise<APIGatewayProxyResult> {
  return await modifyResources({
    resourceId,
    tokenPayload,
  });
}
