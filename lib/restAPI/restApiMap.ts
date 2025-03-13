import { Stack } from "aws-cdk-lib";
import { createLambdaRole } from "@utils/rolesFuncs/createLambdaRole";
import { createDynamoPolicy } from "@utils/rolesFuncs/createDynamoPolicy";
import { HostingStack } from "../hosting/hostingStack";
import {
  generateLocation,
  RestAPIType,
} from "@utils/createResources/createApiTree";
import { convertToStr } from "@utils/general/convertToStr";
import createSESPolicy from "@utils/rolesFuncs/createSESPolicy";
import createSNSPolicy from "@utils/rolesFuncs/createSNSPolicy";
import {
  AMAZON_DYNAMO_DB_HOBBIES_TABLE_ENV_NAME,
  AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME,
  AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_ENV_NAME,
  AMAZON_DYNAMO_DB_PROJECT_TABLE_ENV_NAME,
  AMAZON_DYNAMO_DB_SKILLS_TABLE_ENV_NAME,
  AMAZON_REST_API_DOMAIN_ENV_NAME,
  AMAZON_REST_API_KEY_ENV_NAME,
  AMAZON_REST_API_KEY_ENV_VALUE,
  HOBBIES_DB_TABLE_NAME,
  METRIC_DB_TABLE_NAME,
  PROJECTS_DB_TABLE_NAME,
  PROJECTS_IMAGES_DB_TABLE_NAME,
  S3_MEDIA_FILES_BUCKET_ENV_NAME,
  SEND_IN_BLUE_API_KEY_ENV_NAME,
  SEND_IN_BLUE_API_KEY_ENV_VALUE,
  SES_EMAIL_ADDRESS_ENV_NAME,
  SES_EMAIL_ADDRESS_ENV_VALUE,
  SKILLS_DB_TABLE_NAME,
  SNS_PHONE_NUMBER_ENV_NAME,
  SNS_PHONE_NUMBER_ENV_VALUE,
} from "@lib/constants";
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
  return {
    userMetrics: {
      options: {
        location: generateLocation(["utils", "corsLambda"], __dirname),
        apiKeyRequired: false,
      },
      get: {
        location: generateLocation(["userMetrics", "get"], __dirname),
        env: {
          [AMAZON_DYNAMO_DB_METRICS_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[METRIC_DB_TABLE_NAME].name
          ),
        },
        role: createLambdaRole(
          "UserMetricsGetRole",
          {
            metricsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("GET", tablesInfoMap[METRIC_DB_TABLE_NAME])
              : null,
          },
          stack
        ),
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
              ? createDynamoPolicy("GET", tablesInfoMap[HOBBIES_DB_TABLE_NAME])
              : null,
          },
          stack
        ),
        env: {
          [AMAZON_DYNAMO_DB_HOBBIES_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[HOBBIES_DB_TABLE_NAME].name
          ),
        },
      },
      put: {
        location: generateLocation(["hobbies", "put"], __dirname),
        role: createLambdaRole(
          "HobbiesPutRole",
          {
            hobbiesDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("PUT", tablesInfoMap[HOBBIES_DB_TABLE_NAME])
              : null,
          },
          stack
        ),
        env: {
          [AMAZON_DYNAMO_DB_HOBBIES_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[HOBBIES_DB_TABLE_NAME].name
          ),
        },
      },
      delete: {
        location: generateLocation(["hobbies", "delete"], __dirname),
        role: createLambdaRole(
          "HobbiesDeleteRole",
          {
            hobbiesDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy(
                  "DELETE",
                  tablesInfoMap[HOBBIES_DB_TABLE_NAME]
                )
              : null,
          },
          stack
        ),
        env: {
          [AMAZON_DYNAMO_DB_HOBBIES_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[HOBBIES_DB_TABLE_NAME].name
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
            [AMAZON_REST_API_KEY_ENV_NAME]: AMAZON_REST_API_KEY_ENV_VALUE,
            [AMAZON_REST_API_DOMAIN_ENV_NAME]: convertToStr(restApiDomainName),
            [AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_ENV_NAME]: convertToStr(
              tablesInfoMap?.[PROJECTS_IMAGES_DB_TABLE_NAME].name
            ),
          },
          role: createLambdaRole(
            "ProjectImagesGetRole",
            {
              projectsDynamoDBPolicy: tablesInfoMap
                ? createDynamoPolicy(
                    "GET",
                    tablesInfoMap[PROJECTS_IMAGES_DB_TABLE_NAME]
                  )
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
                ? createDynamoPolicy(
                    "DELETE",
                    tablesInfoMap[PROJECTS_IMAGES_DB_TABLE_NAME]
                  )
                : null,
            },
            stack
          ),
          env: {
            [AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_ENV_NAME]: convertToStr(
              tablesInfoMap?.[PROJECTS_IMAGES_DB_TABLE_NAME].name
            ),
          },
        },
        put: {
          location: generateLocation(["projects", "images", "put"], __dirname),
          role: createLambdaRole(
            "ProjectImagesPutRole",
            {
              projectsDynamoDBPolicy: tablesInfoMap
                ? createDynamoPolicy(
                    "PUT",
                    tablesInfoMap[PROJECTS_IMAGES_DB_TABLE_NAME]
                  )
                : null,
            },
            stack
          ),
          env: {
            [AMAZON_DYNAMO_DB_PROJECT_IMAGES_TABLE_ENV_NAME]: convertToStr(
              tablesInfoMap?.[PROJECTS_IMAGES_DB_TABLE_NAME].name
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
              ? createDynamoPolicy("GET", tablesInfoMap[PROJECTS_DB_TABLE_NAME])
              : null,
          },
          stack
        ),
        env: {
          [AMAZON_DYNAMO_DB_PROJECT_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[PROJECTS_DB_TABLE_NAME].name
          ),
        },
      },
      post: {
        location: generateLocation(["projects", "post"], __dirname),
        role: createLambdaRole(
          "ProjectsPostRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy(
                  "POST",
                  tablesInfoMap[PROJECTS_DB_TABLE_NAME]
                )
              : null,
          },
          stack
        ),
        env: {
          [AMAZON_DYNAMO_DB_PROJECT_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[PROJECTS_DB_TABLE_NAME].name
          ),
        },
      },
      put: {
        location: generateLocation(["projects", "put"], __dirname),
        role: createLambdaRole(
          "ProjectsPutRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("PUT", tablesInfoMap[PROJECTS_DB_TABLE_NAME])
              : null,
          },
          stack
        ),
        env: {
          [AMAZON_DYNAMO_DB_PROJECT_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[PROJECTS_DB_TABLE_NAME].name
          ),
        },
      },
      delete: {
        location: generateLocation(["projects", "delete"], __dirname),
        role: createLambdaRole(
          "ProjectsDeleteRole",
          {
            projectsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy(
                  "DELETE",
                  tablesInfoMap[PROJECTS_DB_TABLE_NAME]
                )
              : null,
          },
          stack
        ),
        env: {
          [S3_MEDIA_FILES_BUCKET_ENV_NAME]: hostingStack
            ? hostingStack.getImgBucket().bucketName
            : "",
          [AMAZON_DYNAMO_DB_PROJECT_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[PROJECTS_DB_TABLE_NAME].name
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
          [AMAZON_DYNAMO_DB_SKILLS_TABLE_ENV_NAME]: convertToStr(
            tablesInfoMap?.[SKILLS_DB_TABLE_NAME].name
          ),
        },
        role: createLambdaRole(
          "SkillsGetRole",
          {
            skillsDynamoDBPolicy: tablesInfoMap
              ? createDynamoPolicy("GET", tablesInfoMap[SKILLS_DB_TABLE_NAME])
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
          [SES_EMAIL_ADDRESS_ENV_NAME]: SES_EMAIL_ADDRESS_ENV_VALUE,
          [SNS_PHONE_NUMBER_ENV_NAME]: SNS_PHONE_NUMBER_ENV_VALUE,
          [SEND_IN_BLUE_API_KEY_ENV_NAME]: SEND_IN_BLUE_API_KEY_ENV_VALUE,
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
