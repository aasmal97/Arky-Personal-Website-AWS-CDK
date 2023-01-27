import { RestAPIType } from "../restApiMap";

export const apiMethods = {
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
export const createFuncLocationMap = (
  apiMap: { [key: string]: RestAPIType | string },
  id?: string
) => {
  let map: { [key: string]: string } = {};
  const entries = Object.entries(apiMap);
  for (let [key, value] of entries) {
    let newKey = `${id ? id + " " : ""}${key}`;
    let addMap: { [key: string]: string } = {};
    if (key in apiMethods && typeof value === "string")
      addMap[camelCase(newKey)] = value;
    else if (typeof value !== "string")
      addMap = createFuncLocationMap(value, newKey);
    map = { ...map, ...addMap };
  }
  return map;
};
export default createFuncLocationMap;
