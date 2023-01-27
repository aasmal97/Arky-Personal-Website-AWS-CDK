import { ResourceObj } from "./createApiTree";
import * as cdk from "aws-cdk-lib";

export const traverseAPITree = (keyArr: string[], e: ResourceObj) => {
  let currMap = e;
  for (let i of keyArr) {
    const curr = currMap[i];
    if (
      !(curr instanceof cdk.aws_apigateway.Resource) &&
      !(curr instanceof cdk.aws_apigateway.Method)
    )
      currMap = curr;
  }
  return currMap;
};
