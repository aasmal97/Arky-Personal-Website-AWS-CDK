import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import { Stack } from "aws-cdk-lib";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../utils/rolesFuncs/createDynamoPolicy";
import { HostingStack } from "../hosting/hostingStack";
import {
  generateLocation,
  RestAPIType,
} from "../../../utils/createResources/createApiTree";

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
  const parsed = searchForSecretsWrapper(__dirname);
  return {
    userMetrics: {
      get: {
        location: generateLocation(["userMetrics", "get"], __dirname),
        env: {
          GIT_HUB_PERSONAL_ACCESS_TOKEN: parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            ? parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            : "",
        },
      },
    },
    hobbies: {
      get: {
        location: generateLocation(["hobbies", "get"], __dirname),
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
        location: generateLocation(["hobbies", "post"], __dirname),
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
        location: generateLocation(["hobbies", "put"], __dirname),
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
        location: generateLocation(["hobbies", "delete"], __dirname),
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
      images: {
        get: {
          location: generateLocation(["projects", "images", "get"], __dirname),
          role: createLambdaRole(
            "ProjectImagesGetRole",
            {
              projectsDynamoDBPolicy: tablesInfoMap
                ? createDynamoPolicy("GET", tablesInfoMap["projectImages"])
                : null,
            },
            stack
          ),
        },
        delete: {
          location: generateLocation(
            ["projects", "images", "delete"],
            __dirname
          ),
          role: createLambdaRole(
            "ProjectImagesDeleteRole",
            {
              projectsDynamoDBPolicy: tablesInfoMap
                ? createDynamoPolicy("DELETE", tablesInfoMap["projectImages"])
                : null,
            },
            stack
          ),
        },
        put: {
          location: generateLocation(["projects", "images", "put"], __dirname),
          role: createLambdaRole(
            "ProjectImagesPutRole",
            {
              projectsDynamoDBPolicy: tablesInfoMap
                ? createDynamoPolicy("PUT", tablesInfoMap["projectImages"])
                : null,
            },
            stack
          ),
        },
      },
      get: {
        location: generateLocation(["projects", "get"], __dirname),
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
        location: generateLocation(["projects", "post"], __dirname),
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
        location: generateLocation(["projects", "put"], __dirname),
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
        location: generateLocation(["projects", "delete"], __dirname),
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
