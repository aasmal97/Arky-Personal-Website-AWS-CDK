import { apiMethods, camelCase } from "./utils/createFuncLocationMap";
export type RestAPIType = { [key: string]: string | RestAPIType };

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
const restAPIMap: RestAPIType = {
  hobbies: {
    get: generateLocation(["hobbies", "get"]),
    post: generateLocation(["hobbies", "post"]),
    put: generateLocation(["hobbies", "put"]),
    delete: generateLocation(["hobbies", "delete"]),
  },
  projects: {
    get: generateLocation(["projects", "get"]),
    post: generateLocation(["projects", "post"]),
    put: generateLocation(["projects", "put"]),
    delete: generateLocation(["projects", "delete"]),
  },
};

export default restAPIMap;
