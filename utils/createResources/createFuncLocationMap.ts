import {
  isRestAPILambdaProps,
  RestAPILambdaProps,
  RestAPIType,
} from "@utils/createResources/createApiTree";

export const apiMethods = {
  options: true,
  get: true,
  post: true,
  put: true,
  delete: true,
};
export const extractKeysFromFuncName = (str: string) => {
  return str
    .split(/(?=[A-Z])/)
    .map((e) => e.charAt(0).toLowerCase() + e.substring(1));
};

export function camelCase(string: string) {
  //remove trailing whitespace character
  const newString = string.replace(/^\s+|\s+$/g, "");
  //Camel case
  let parts = newString.split(" ");
  for (let i = 1; i < parts.length; i++) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
  }
  return parts.join("");
}
export function hasEndingMethod(str: string): string {
  const methods = ["GET", "PUT", "DELETE", "POST"];
  let ending = "";
  const test = methods.some((method) => {
    const result = str.endsWith(method);
    if (result) ending = method;
    return result;
  });
  return ending;
}
export const createFuncLocationMap = (apiMap: RestAPIType, id?: string) => {
  let map: { [key: string]: RestAPILambdaProps } = {};
  const entries = Object.entries(apiMap);
  for (let [key, value] of entries) {
    let newKey = `${id ? id + " " : ""}${key}`;
    let addMap: { [key: string]: RestAPILambdaProps } = {};
    if (key in apiMethods && isRestAPILambdaProps(value))
      addMap[camelCase(newKey)] = value;
    else if (!isRestAPILambdaProps(value))
      addMap = createFuncLocationMap(value, newKey);
    map = { ...map, ...addMap };
  }
  return map;
};
export default createFuncLocationMap;
