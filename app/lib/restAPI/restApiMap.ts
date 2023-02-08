import {
  apiMethods,
  camelCase,
} from "../../../utils/createResources/createFuncLocationMap";
import { aws_iam, Stack } from "aws-cdk-lib";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../utils/rolesFuncs/createDynamoPolicy";
import path = require("path");
export type RestAPILambdaProps = {
  location: {
    relative: string;
    absolute: string;
  };
  role?: aws_iam.IRole;
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

const restAPIMap = (
  stack?: Stack,
  tablesInfoMap?: {
    [key: string]: {
      id: string;
      arn: string;
    };
  }
): RestAPIType => {
  return {
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
      },
    },
  };
};

export default restAPIMap;
