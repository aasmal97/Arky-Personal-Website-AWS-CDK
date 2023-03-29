import webhooksApiMap from "./webhooksApiMap";
import createFuncLocationMap from "../../../utils/createResources/createFuncLocationMap";
import { execShellCommand } from "../../../utils/buildFuncs/execShellCommand";
import { generateLocation } from "../../../utils/createResources/createApiTree";
const outPath = "../../../build/app/lib/webhooks/resources";
const locationFuncMap = createFuncLocationMap(webhooksApiMap({}));
const locationArr = Object.entries(locationFuncMap).map(([key, value]) => {
  const newPath = value.location.relative + "/index.ts";
  return newPath;
});
const googleDrivePostStateMachineLocation = generateLocation(
  ["googleDrive", "post", "stepFunction"],
  __dirname
);
locationArr.push(googleDrivePostStateMachineLocation.relative + "/index.ts");
const command = locationArr.reduce((a, b) => a + " " + b);
execShellCommand(
  `esbuild ${command} --bundle --platform=node --outdir=${outPath}`,
  __dirname
)
  .then((e) => console.log(e))
  .catch((err) => {
    console.error(err);
  });
