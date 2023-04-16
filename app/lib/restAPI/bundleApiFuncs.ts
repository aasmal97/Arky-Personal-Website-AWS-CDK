import restApiMap from "./restApiMap";
import createFuncLocationMap from "../../../utils/createResources/createFuncLocationMap";
import { execShellCommand } from "../../../utils/buildFuncs/execShellCommand";
import * as fs from "fs-extra";
import path = require("path");
async function copyDirectory(sourcePath: string, destPath: string) {
  try {
    await fs.copy(sourcePath, destPath);
    console.log("Directory copied successfully.");
  } catch (err) {
    console.error(err);
  }
}
const outPath = "../../../build/app/lib/restAPI/resources";
const locationFuncMap = createFuncLocationMap(restApiMap({}));
const locationArr = Object.entries(locationFuncMap).map(([key, value]) => {
  const newPath = value.location.relative + "/index.ts";
  return newPath;
});
const command = locationArr.reduce((a, b) => a + " " + b);

//bundle node api functions
execShellCommand(
  `esbuild ${command} --bundle --platform=node --outdir=${outPath}`,
  __dirname
)
  .then((e) => console.log(e))
  .catch((err) => {
    console.error(err);
  });
//copy skill function to build folder
// Define the source and destination paths
const generalPath = path.join(__dirname, "./resources/skills/cronJob");
const skillSourcePath = generalPath;
const skillDestPath = generalPath.replace(
  "\\app\\lib\\restAPI\\",
  "\\build\\app\\lib\\restAPI\\"
);
copyDirectory(skillSourcePath, skillDestPath)
  .then((e) => {
    console.log(e);
  })
  .catch((err) => {
    throw err;
  });
