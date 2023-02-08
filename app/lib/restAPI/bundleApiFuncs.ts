import restApiMap from "./restApiMap";
import createFuncLocationMap from "../../../utils/createResources/createFuncLocationMap";
import { execShellCommand } from "../../../utils/buildFuncs/execShellCommand";
const outPath = "../../../build/app/lib/restAPI/resources";
const locationFuncMap = createFuncLocationMap(restApiMap());
const locationArr = Object.entries(locationFuncMap).map(([key, value]) => {
  const newPath = value.location.relative + "/index.ts";
  return newPath;
});
const command = locationArr.reduce((a, b) => a + " " + b);

execShellCommand(
  `esbuild ${command} --bundle --platform=node --outdir=${outPath}`,
  __dirname
)
  .then((e) => console.log(e))
  .catch((err) => {
    console.error(err);
  });
