import {
  RestAPIType,
  generateLocation,
} from "../../../utils/createResources/createApiTree";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
const convertToStr = (str: string | undefined) => {
  if (typeof str === "string") return str;
  else return "";
};
const webhooksApiMap = ({
  webhooksAPIDomainName,
}: {
  webhooksAPIDomainName: string;
}): RestAPIType => {
  const parsed = searchForSecretsWrapper(__dirname);
  return {
    github: {
      post: {
        location: generateLocation(["github", "post"], __dirname),
        env: {
          WEBHOOKS_API_TOKEN: convertToStr(parsed.WEBHOOKS_API_TOKEN),
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
        },
      },
    },
    googleDrive: {
      post: {
        location: generateLocation(["googleDrive", "post"], __dirname),
        env: {
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
          WEBHOOKS_API_TOKEN: convertToStr(parsed.WEBHOOKS_API_TOKEN),
          GOOGLE_CLIENT_ID: convertToStr(parsed.GOOGLE_CLIENT_ID),
          GOOGLE_CLIENT_SECRET: convertToStr(parsed.GOOGLE_CLIENT_SECRET),
          GOOGLE_REFRESH_TOKEN: convertToStr(parsed.GOOGLE_REFRESH_TOKEN),
        },
      },
    },
    watch: {
      github: {
        put: {
          location: generateLocation(["watch", "github", "put"], __dirname),
          env: {},
        },
      },
      googleDrive: {
        put: {
          location: generateLocation(
            ["watch", "googleDrive", "put"],
            __dirname
          ),
          env: {
            GOOGLE_CLIENT_ID: convertToStr(parsed.GOOGLE_CLIENT_ID),
            GOOGLE_CLIENT_SECRET: convertToStr(parsed.GOOGLE_CLIENT_SECRET),
            GOOGLE_REFRESH_TOKEN: convertToStr(parsed.GOOGLE_REFRESH_TOKEN),
            WEBHOOKS_API_DOMAIN_NAME: webhooksAPIDomainName,
            WEBHOOKS_API_TOKEN: convertToStr(parsed.WEBHOOKS_API_TOKEN),
            GOOGLE_DRIVE_FOLDER_NAME: convertToStr(
              parsed.GOOGLE_DRIVE_FOLDER_NAME
            ),
            GOOGLE_DRIVE_PARENT_FOLDER_NAME: convertToStr(
              process.env.GOOGLE_DRIVE_PARENT_FOLDER_NAME
            ),
          },
        },
      },
    },
  };
};

export default webhooksApiMap;
