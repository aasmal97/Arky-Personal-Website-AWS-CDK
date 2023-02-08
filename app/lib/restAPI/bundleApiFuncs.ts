import restApiMap from "./restApiMap";
import createFuncLocationMap from "../../../utils/createResources/createFuncLocationMap";
import process = require("child_process");
const outPath = "../../../build/app/lib/restAPI/resources";

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
const locationFuncMap = createFuncLocationMap(restApiMap());
const locationArr = Object.entries(locationFuncMap).map(([key, value]) => {
  const newPath = value.location.relative + "/index.ts";
  return newPath;
});
const command = locationArr.reduce((a, b) => a + " " + b);

execShellCommand(
  `esbuild ${command} --bundle --platform=node --outdir=${outPath}`
)
  .then((e) => console.log(e))
  .catch((err) => {
    console.error(err);
  });
