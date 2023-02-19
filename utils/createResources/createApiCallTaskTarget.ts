import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { ApiGateway } from "aws-cdk-lib/aws-events-targets";
export type CreateApiCallTaskTargetProps = {
  restApi: RestApi;
  path: string;
}
export const createApiCallTaskTarget = ({
  restApi,
  path,
}:CreateApiCallTaskTargetProps ) => {
  const target = new ApiGateway(restApi, {
    path: path,
    method: "PUT",
  });
  return target;
};
