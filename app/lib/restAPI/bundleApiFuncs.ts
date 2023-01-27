import restApiMap from "./restApiMap";
import process = require("child_process");
import createFuncLocationMap from "./utils/createFuncLocationMap";
const outPath = "build";
//this will match resources directory in path, and replace it with
//the name of the outDirectory path
export function replaceDirToBuild(pathStr: string, directory: string) {
  const regex = new RegExp(directory);
  const newPath = pathStr.replace(regex, outPath);
  return newPath;
}
function execShellCommand(cmd: string) {
  const exec = process.exec;
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        resolve(stdout ? stdout : stderr);
      }
    );
  });
}
const locationFuncMap = createFuncLocationMap(restApiMap);
const locationArr = Object.entries(locationFuncMap).map(([key, value]) => {
  const newPath = value + "/index.js";
  const subPath = newPath.substring(2, newPath.length);
  return subPath;
});
const command = locationArr.reduce((a, b) => a + " " + b);

execShellCommand(`esbuild ${command} --bundle --outdir=${outPath}`);
