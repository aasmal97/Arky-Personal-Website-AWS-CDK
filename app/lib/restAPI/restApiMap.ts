import { apiMethods, camelCase } from "./utils/createFuncLocationMap";
import { aws_iam, Stack } from "aws-cdk-lib";
import { createLambdaRole } from "./utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "./utils/rolesFuncs/createDynamoPolicy";
export type RestAPILambdaProps = {
  location: string;
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
const generateLocation = (path: string[]) => {
  let location = "./resources/" + path[0];
  for (let i in path) {
    if (parseInt(i) <= 0) continue;
    if (path[i] in apiMethods)
      location += "/" + path[parseInt(i) - 1] + " " + path[i];
    else location += "/" + path[i];
  }
  return camelCase(location);
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
