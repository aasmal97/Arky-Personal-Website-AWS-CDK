import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { ApiGateway } from "aws-cdk-lib/aws-events-targets";
export type CreateApiCallTaskTargetProps = {
  restApi: RestApi;
  path: string;
  headerParams?: {[key:string]: string }
}
export const createApiCallTaskTarget = ({
  restApi,
  path,
  headerParams
}:CreateApiCallTaskTargetProps ) => {
  const target = new ApiGateway(restApi, {
    path: path,
    method: "PUT",
    headerParameters: headerParams 
  });
  return target;
};
