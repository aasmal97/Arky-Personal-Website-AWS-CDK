import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import { Stack } from "aws-cdk-lib";
import { createLambdaRole } from "../../../utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "../../../utils/rolesFuncs/createDynamoPolicy";
import { HostingStack } from "../hosting/hostingStack";
import {
  generateLocation,
  RestAPIType,
} from "../../../utils/createResources/createApiTree";
import { convertToStr } from "../../../utils/general/convertToStr";
import createSESPolicy from "../../../utils/rolesFuncs/createSESPolicy";
import createSNSPolicy from "../../../utils/rolesFuncs/createSNSPolicy";
const restAPIMap = ({
  hostingStack,
  stack,
  tablesInfoMap,
  restApiDomainName,
}: {
  restApiDomainName?: string;
  hostingStack?: HostingStack;
  stack?: Stack;
  tablesInfoMap?: {
    [key: string]: {
      id: string;
      arn: string;
      name: string;
    };
  };
}): RestAPIType => {
  const parsed = searchForSecretsWrapper(__dirname);
  return {
    userMetrics: {
      options: {
        location: generateLocation(["utils", "corsLambda"], __dirname),
        apiKeyRequired: false,
      },
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
      options: {
        location: generateLocation(["utils", "corsLambda"], __dirname),
        apiKeyRequired: false,
      },
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
        env: {
          AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME: convertToStr(
            tablesInfoMap?.["hobbies"].name
          ),
        },
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
        env: {
          AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME: convertToStr(
            tablesInfoMap?.["hobbies"].name
          ),
        },
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
        env: {
          AMAZON_DYNAMO_DB_HOBBIES_TABLE_NAME: convertToStr(
            tablesInfoMap?.["hobbies"].name
          ),
        },
      },
    },
    projects: {
      options: {
        location: generateLocation(["utils", "corsLambda"], __dirname),
        apiKeyRequired: false,
      },
      images: {
        options: {
          location: generateLocation(["utils", "corsLambda"], __dirname),
          apiKeyRequired: false,
        },
        get: {
          location: generateLocation(["projects", "images", "get"], __dirname),
          env: {
            AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
            AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
            AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME: convertToStr(
              tablesInfoMap?.["projectImages"].name
            ),
          },
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
          env: {
            AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME: convertToStr(
              tablesInfoMap?.["projectImages"].name
            ),
          },
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
          env: {
            AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_NAME: convertToStr(
              tablesInfoMap?.["projectImages"].name
            ),
          },
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
        env: {
          AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME: convertToStr(
            tablesInfoMap?.["projects"].name
          ),
        },
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
        env: {
          AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME: convertToStr(
            tablesInfoMap?.["projects"].name
          ),
        },
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
        env: {
          AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME: convertToStr(
            tablesInfoMap?.["projects"].name
          ),
        },
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
          AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME: convertToStr(
            tablesInfoMap?.["projects"].name
          ),
        },
      },
    },
    skills: {
      options: {
        location: generateLocation(["utils", "corsLambda"], __dirname),
        apiKeyRequired: false,
      },
      get: {
        location: generateLocation(["skills", "get"], __dirname),
        apiKeyRequired: false,
        env: {
          AMAZON_DYNAMO_DB_SKILLS_TABLE_NAME: convertToStr(
            tablesInfoMap?.["skills"].name
          ),
        },
        role: createLambdaRole(
          "SkillsGetRole",
          {
            skillsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("GET", tablesInfoMap["skills"])
              : null,
          },
          stack
        ),
      },
    },
    contact: {
      options: {
        location: generateLocation(["utils", "corsLambda"], __dirname),
        apiKeyRequired: false,
      },
      post: {
        location: generateLocation(["contact", "post"], __dirname),
        apiKeyRequired: false,
        env: {
          SES_EMAIL_ADDRESS: convertToStr(parsed.SES_EMAIL_ADDRESS),
          SNS_PHONE_NUMBER: convertToStr(parsed.SNS_PHONE_NUMBER),
          SEND_IN_BLUE_API_KEY: convertToStr(parsed.SEND_IN_BLUE_API_KEY)
        },
        role: createLambdaRole(
          "ContactPostRole",
          {
            contactSesFullAccess: createSESPolicy(),
            contactSnsFullAccess: createSNSPolicy(),
          },
          stack
        ),
      },
    },
  };
};
export default restAPIMap;
