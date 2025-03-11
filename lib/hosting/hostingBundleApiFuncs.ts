import { execShellCommand } from "@utils/buildFuncs/execShellCommand";
//bundle node api functions
const outPath = "../../../build/app/lib/hosting";
const command = "clientCloudfrontRedirectBehaviorFunc.ts";
execShellCommand(
  //`esbuild ${command} --bundle --platform=node --outdir=${outPath}`,
  `tsc ${command} --target es5 --outDir ${outPath}`,
  __dirname
)
  .then((e) => console.log(e))
  .catch((err) => {
    console.error(err);
  });
