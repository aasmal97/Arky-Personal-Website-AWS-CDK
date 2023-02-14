import {
  RestAPIType,
  generateLocation,
} from "../../../utils/createResources/createApiTree";
import { searchForSecretsWrapper } from "../../../utils/buildFuncs/searchForSecrets";
const webhooksApiMap = ({}: {}): RestAPIType => {
  const parsed = searchForSecretsWrapper(__dirname);
  return {
    github: {
      post: {
        location: generateLocation(["github", "post"], __dirname),
      },
    },
    googleDrive: {
      post: {
        location: generateLocation(["googleDrive", "post"], __dirname),
      },
    },
  };
};

export default webhooksApiMap;
