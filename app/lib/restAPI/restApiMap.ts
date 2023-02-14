import {
  apiMethods,
  camelCase,
} from "../../../utils/createResources/createFuncLocationMap";
import { aws_iam, Stack } from "aws-cdk-lib";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../utils/rolesFuncs/createDynamoPolicy";
import path = require("path");
import { FunctionOptions } from "aws-cdk-lib/aws-lambda";
import * as dotenv from "dotenv";
import { HostingStack } from "../hosting/hostingStack";
export type RestAPILambdaProps = {
  location: {
    relative: string;
    absolute: string;
  };
  role?: aws_iam.IRole;
  env?: FunctionOptions["environment"];
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

const generateLocation = (providedPath: string[]) => {
  let location = "resources/" + providedPath[0];
  for (let i in providedPath) {
    if (parseInt(i) <= 0) continue;
    if (providedPath[i] in apiMethods)
      location += "/" + providedPath[parseInt(i) - 1] + " " + providedPath[i];
    else location += "/" + providedPath[i];
  }
  const relative = camelCase(location);
  const absolute = path.join(__dirname, relative);
  return {
    relative,
    absolute,
  };
};
const searchForSecrets = (strPath: string): dotenv.DotenvConfigOutput => {
  try {
    if (strPath.length <= 0) return {};
    //this is here to ensure all environment variables are reached
    //in github action runner or when deploying locally
    const pathToENV = path.resolve(strPath, ".env");
    const currConfig = dotenv.config({
      path: pathToENV,
    });
    if (currConfig.parsed) return currConfig.parsed;
    else {
      const newPath = path.resolve(strPath, "..");
      //we've reached the root directory
      if (newPath === strPath) return {};
      return searchForSecrets(newPath);
    }
  } catch (err) {
    console.error(err);
    return {};
  }
};
const restAPIMap = ({
  hostingStack,
  stack,
  tablesInfoMap,
}: {
  hostingStack?: HostingStack;
  stack?: Stack;
  tablesInfoMap?: {
    [key: string]: {
      id: string;
      arn: string;
    };
  };
}): RestAPIType => {
  // const autoConfig = dotenv.config();
  let obj: { [key: string]: string | undefined } = {};
  const currConfig = searchForSecrets(__dirname);
  const currProcess = process.env;
  obj = { ...currProcess, ...currConfig.parsed };
  const parsed = obj;
  return {
    userMetrics: {
      get: {
        location: generateLocation(["userMetrics", "get"]),
        env: {
          GIT_HUB_PERSONAL_ACCESS_TOKEN: parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            ? parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            : "",
        },
      },
    },
    hobbies: {
      get: {
        location: generateLocation(["hobbies", "get"]),
        role: createLambdaRole(
          "HobbiesGetRole",
          {
            hobbiesDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("GET", tablesInfoMap["hobbies"])
              : null,
          },
          stack
        ),
      },
      post: {
        location: generateLocation(["hobbies", "post"]),
        role: createLambdaRole(
          "HobbiesPostRole",
          {
            hobbiesDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("POST", tablesInfoMap["hobbies"])
              : null,
          },
          stack
        ),
      },
      put: {
        location: generateLocation(["hobbies", "put"]),
        role: createLambdaRole(
          "HobbiesPutRole",
          {
            hobbiesDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("PUT", tablesInfoMap["hobbies"])
              : null,
          },
          stack
        ),
      },
      delete: {
        location: generateLocation(["hobbies", "delete"]),
        role: createLambdaRole(
          "HobbiesDeleteRole",
          {
            hobbiesDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("DELETE", tablesInfoMap["hobbies"])
              : null,
          },
          stack
        ),
      },
    },
    projects: {
      get: {
        location: generateLocation(["projects", "get"]),
        role: createLambdaRole(
          "ProjectsGetRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("GET", tablesInfoMap["projects"])
              : null,
          },
          stack
        ),
      },
      post: {
        location: generateLocation(["projects", "post"]),
        role: createLambdaRole(
          "ProjectsPostRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("POST", tablesInfoMap["projects"])
              : null,
          },
          stack
        ),
      },
      put: {
        location: generateLocation(["projects", "put"]),
        role: createLambdaRole(
          "ProjectsPutRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("PUT", tablesInfoMap["projects"])
              : null,
          },
          stack
        ),
      },
      delete: {
        location: generateLocation(["projects", "delete"]),
        role: createLambdaRole(
          "ProjectsDeleteRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("DELETE", tablesInfoMap["projects"])
              : null,
          },
          stack
        ),
        env: {
          S3_MEDIA_FILES_BUCKET_NAME: hostingStack
            ? hostingStack.getImgBucket().bucketName
            : "",
        },
      },
    },
  };
};
export default restAPIMap;
