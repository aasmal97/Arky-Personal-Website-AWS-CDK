import {
  RestAPIType,
  generateLocation,
} from "../../../utils/createResources/createApiTree";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
import { convertToStr } from "../../../utils/general/convertToStr";
const webhooksApiMap = ({
  webhooksAPIDomainName,
  restApiDomainName,
}: {
  restApiDomainName?: string;
  webhooksAPIDomainName?: string;
}): RestAPIType => {
  const parsed = searchForSecretsWrapper(__dirname);
  return {
    github: {
      post: {
        location: generateLocation(["github", "post"], __dirname),
        env: {
          AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
          WEBHOOKS_API_TOKEN_SECRET: convertToStr(
            parsed.WEBHOOKS_API_TOKEN_SECRET
          ),
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
        },
        apiKeyRequired: false,
      },
    },
    googleDrive: {
      post: {
        location: generateLocation(["googleDrive", "post"], __dirname),
        env: {
          AMAZON_REST_API_DOMAIN_NAME: convertToStr(restApiDomainName),
          AMAZON_REST_API_KEY: convertToStr(parsed.AMAZON_REST_API_KEY),
          WEBHOOKS_API_KEY: convertToStr(parsed.WEBHOOKS_API_KEY),
          WEBHOOKS_API_TOKEN_SECRET: convertToStr(
            parsed.WEBHOOKS_API_TOKEN_SECRET
          ),
          GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: convertToStr(
            process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
          ),
          // GOOGLE_CLIENT_ID: convertToStr(parsed.GOOGLE_CLIENT_ID),
          // GOOGLE_CLIENT_SECRET: convertToStr(parsed.GOOGLE_CLIENT_SECRET),
          // GOOGLE_REFRESH_TOKEN: convertToStr(parsed.GOOGLE_REFRESH_TOKEN),
        },
        apiKeyRequired: false,
      },
    },
    watch: {
      githubChannel: {
        put: {
          location: generateLocation(
            ["watch", "githubChannel", "put"],
            __dirname
          ),
          env: {
            GIT_HUB_PERSONAL_ACCESS_TOKEN: convertToStr(
              parsed.GIT_HUB_PERSONAL_ACCESS_TOKEN
            ),
            WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
            WEBHOOKS_API_TOKEN_SECRET: convertToStr(
              parsed.WEBHOOKS_API_TOKEN_SECRET
            ),
          },
        },
      },
      googleDriveChannel: {
        put: {
          location: generateLocation(
            ["watch", "googleDriveChannel", "put"],
            __dirname
          ),
          env: {
            // GOOGLE_CLIENT_ID: convertToStr(parsed.GOOGLE_CLIENT_ID),
            // GOOGLE_CLIENT_SECRET: convertToStr(parsed.GOOGLE_CLIENT_SECRET),
            // GOOGLE_REFRESH_TOKEN: convertToStr(parsed.GOOGLE_REFRESH_TOKEN),
            GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: convertToStr(
              process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
            ),
            WEBHOOKS_API_DOMAIN_NAME: convertToStr(webhooksAPIDomainName),
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
