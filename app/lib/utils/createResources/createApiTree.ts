import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import path = require("path");
import { replaceDirToBuild } from "../../restAPI/bundleApiFuncs";
import { isRestAPILambdaProps, RestAPIType } from "../../restAPI/restApiMap";
import createFuncLocationMap, {
  apiMethods,
  camelCase,
} from "./createFuncLocationMap";

export type KeyWordsResources = {
  [key: string]: any;
  apiResource?: cdk.aws_apigateway.Resource;
  apiMethod?: cdk.aws_apigateway.Method;
};
export type ResourceObj = {
  [key: string]:
    | (ResourceObj & KeyWordsResources)
    | cdk.aws_apigateway.Resource
    | cdk.aws_apigateway.Method;
};
export type CreateAPITreeProps = {
  e: ResourceObj;
  apiMap: RestAPIType;
  integrationMap: { [key: string]: cdk.aws_apigateway.LambdaIntegration };
  resourceName?: string;
  currPath: string;
};
export const resourceKeyWords: { [key: string]: boolean } = {
  apiResource: true,
  apiMethods: true,
};
export const addMethod = ({
  key,
  e,
  integrationMap,
  resourceName,
  currPath,
}: {
  key: string;
  e: ResourceObj;
  integrationMap: { [key: string]: cdk.aws_apigateway.LambdaIntegration };
  resourceName?: string;
  currPath: string;
}) => {
  if (typeof resourceName === "string") {
    const name = e[resourceName];
    if (
      !(name instanceof cdk.aws_apigateway.Resource) &&
      !(name instanceof cdk.aws_apigateway.Method)
    ) {
      const resource = name.apiResource;
      if (resource && resource instanceof cdk.aws_apigateway.Resource) {
        const newCurrPath = camelCase(`${currPath} ${key}`);
        const integration = integrationMap[newCurrPath];
        name[key] = {
          apiMethod: resource.addMethod(key, integration, {
            apiKeyRequired: true,
          }),
        };
      }
    }
  }
};
export const addResource = ({
  key,
  e,
  callback,
  apiMap,
  integrationMap,
  resourceName,
  currPath,
}: {
  currPath: string;
  key: string;
  e: ResourceObj;
  callback: (e: CreateAPITreeProps) => ResourceObj;
  apiMap: RestAPIType;
  integrationMap: { [key: string]: cdk.aws_apigateway.LambdaIntegration };
  resourceName?: string;
}) => {
  if (!resourceName) return;
  const name = e[resourceName];
  if (
    !(name instanceof cdk.aws_apigateway.Resource) &&
    !(name instanceof cdk.aws_apigateway.Method)
  ) {
    const resource = name.apiResource;
    if (!resource) return;
    name[key] = {
      apiResource: resource.addResource(key),
    };
    const newMap = apiMap[key];
    if (!isRestAPILambdaProps(newMap))
      callback({
        e: name[key],
        apiMap: newMap,
        integrationMap,
        resourceName: key,
        currPath: camelCase(`${currPath} ${key}`),
      });
  }
};
//create recursive function for deeper resources in nested routes
export const createApiTree = ({
  e,
  apiMap,
  integrationMap,
  resourceName,
  currPath,
}: CreateAPITreeProps) => {
  let map: ResourceObj = e;
  const entries = Object.entries(apiMap);
  for (let [key, value] of entries) {
    if (key in e) {
      const newMap = apiMap[key];
      //traverse tree one down to have pointers match
      if (!isRestAPILambdaProps(newMap))
        createApiTree({
          e,
          apiMap: newMap,
          integrationMap,
          resourceName: key,
          currPath: camelCase(`${currPath} ${key}`),
        });
    } else if (key in apiMethods)
      addMethod({ key, e, integrationMap, resourceName, currPath });
    else if (!resourceKeyWords[key])
      addResource({
        key,
        e,
        callback: createApiTree,
        apiMap,
        integrationMap,
        resourceName,
        currPath,
      });
  }
  return map;
};
export const rootApiResources = (
  api: cdk.aws_apigateway.RestApi,
  restAPIMap: RestAPIType
) => {
  //initial root resources require a different root method call
  const rootResourcesArr = Object.entries(restAPIMap)
    .map(([key, value]) => key)
    .map((r) => [
      r,
      {
        apiResource: api.root.addResource(r),
      },
    ]);
  const rootResourcesMap: ResourceObj = {};
  for (let [key, value] of rootResourcesArr) {
    if (typeof key === "string" && typeof value !== "string")
      rootResourcesMap[key] = value;
  }
  return rootResourcesMap;
};
export const createLambdaFuncs = (e: cdk.Stack, restAPIMap: RestAPIType) => {
  const funcLocationMap = createFuncLocationMap(restAPIMap);
  //we will use to reference our functions to api gateway
  const funcLocationArr = Object.entries(funcLocationMap);
  const integrationMap: {
    [key: string]: cdk.aws_apigateway.LambdaIntegration;
  } = {};
  //create lambda functions and lambda integrations
  for (let [key, value] of funcLocationArr) {
    const buildPath = replaceDirToBuild(value.location, "resources");
    const newFunc = new lambda.Function(e, key, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: `index.handler`,
      code: lambda.Code.fromAsset(path.join(__dirname, buildPath)),
      role: value.role,
    });
    const integration = new apigateway.LambdaIntegration(newFunc);
    integrationMap[key] = integration;
  }
  return integrationMap;
};
export const createApi = (stack: cdk.Stack, restAPIMap: RestAPIType) => {
  const integrationFuncsMap = createLambdaFuncs(stack, restAPIMap);
  const api = new apigateway.RestApi(stack, "rest-api");
  const rootResourcesMap = rootApiResources(api, restAPIMap);
  //this creates all the resources
  //and methods needed for the api,
  // and adds the respective
  // lambda integration to it
  createApiTree({
    e: rootResourcesMap,
    apiMap: restAPIMap,
    integrationMap: integrationFuncsMap,
    currPath: "",
  });
  return api;
};
