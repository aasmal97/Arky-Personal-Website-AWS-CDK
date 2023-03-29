import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import path = require("path");
import createFuncLocationMap, {
  apiMethods,
  camelCase,
} from "./createFuncLocationMap";
import { aws_iam, Stack } from "aws-cdk-lib";
import { FunctionOptions } from "aws-cdk-lib/aws-lambda";
import { MethodLoggingLevel } from "aws-cdk-lib/aws-apigateway";
export const generateLocation = (
  providedPath: string[],
  dirname: string,
  noInit?: boolean
) => {
  let location = `${noInit ? "" : "resources/"}` + providedPath[0];
  for (let i in providedPath) {
    if (parseInt(i) <= 0) continue;
    if (providedPath[i] in apiMethods)
      location += "/" + providedPath[parseInt(i) - 1] + " " + providedPath[i];
    else location += "/" + providedPath[i];
  }
  const relative = camelCase(location);
  const absolute = path.join(dirname, relative);
  return {
    relative,
    absolute,
  };
};
export type RestAPILambdaProps = {
  location: {
    relative: string;
    absolute: string;
  };
  role?: aws_iam.IRole;
  memorySize?: number;
  env?: FunctionOptions["environment"];
  apiKeyRequired?: boolean;
};
export type RestAPIType = {
  [key: string]: RestAPILambdaProps | RestAPIType;
};
export function isRestAPILambdaProps(e: any): e is RestAPILambdaProps {
  try {
    return e.location;
  } catch (err) {
    return false;
  }
}

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
  resourceName?: string;
  currPath: string;
  integrationMap: {
    [key: string]: {
      integration: cdk.aws_apigateway.LambdaIntegration;
      apiKeyRequired?: boolean;
    };
  };
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
  integrationMap: {
    [key: string]: {
      integration: cdk.aws_apigateway.LambdaIntegration;
      apiKeyRequired?: boolean;
    };
  };
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
        const integration = integrationMap[newCurrPath].integration;
        const apiKeyRequired = integrationMap[newCurrPath].apiKeyRequired;
        name[key] = {
          apiMethod: resource.addMethod(key, integration, {
            //only add key to non-get methods, when not specifically specified.
            //If specificed in props,
            //we use that value
            apiKeyRequired:
              apiKeyRequired || apiKeyRequired === false
                ? apiKeyRequired
                : key !== "get",
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
  integrationMap: {
    [key: string]: {
      integration: cdk.aws_apigateway.LambdaIntegration;
      apiKeyRequired?: boolean;
    };
  };
  resourceName?: string;
}) => {
  if (!resourceName) return;
  const name = e[resourceName];
  if (!name) return;
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
        e: { [key]: name[key] },
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
    } else if (!resourceKeyWords[key] && !(key in apiMethods)) {
      addResource({
        key,
        e,
        callback: createApiTree,
        apiMap,
        integrationMap,
        resourceName,
        currPath,
      });
    } else if (key in apiMethods)
      addMethod({ key, e, integrationMap, resourceName, currPath });
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
    [key: string]: {
      integration: cdk.aws_apigateway.LambdaIntegration;
      apiKeyRequired?: boolean;
    };
  } = {};
  //create lambda functions and lambda integrations
  for (let [key, value] of funcLocationArr) {
    const buildPath = value.location;
    const newFunc = new lambda.Function(e, key, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: `index.handler`,
      code: lambda.Code.fromAsset(buildPath.absolute),
      role: value.role,
      environment: value.env,
      timeout: cdk.Duration.seconds(28),
      memorySize: value.memorySize ? value.memorySize : 512,
    });
    const integration = new apigateway.LambdaIntegration(newFunc);
    integrationMap[key] = {
      integration,
      apiKeyRequired: value.apiKeyRequired,
    };
  }
  return integrationMap;
};
export const createApi = (
  stack: cdk.Stack,
  restAPIMap: RestAPIType,
  id: string
) => {
  const integrationFuncsMap = createLambdaFuncs(stack, restAPIMap);
  const logGroup = new cdk.aws_logs.LogGroup(
    stack,
    `${id}APIGatewayAccessLogs`
  );
  const api = new apigateway.RestApi(stack, id, {
    cloudWatchRole: true,
    deployOptions: {
      accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
      accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      dataTraceEnabled: true,
      loggingLevel: MethodLoggingLevel.INFO,
    },
  });

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
