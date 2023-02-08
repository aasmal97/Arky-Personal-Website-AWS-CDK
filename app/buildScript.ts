import { execShellCommand } from "../utils/buildFuncs/execShellCommand";
execShellCommand(`tsc`, __dirname)
  .then(async (e) => {
    console.log(e);
    const bundleResult = await execShellCommand(
      `npx ts-node ./lib/restAPI/bundleApiFuncs.ts`,
      __dirname
    );
    console.log(bundleResult);
    const cloudFormationResult = await execShellCommand(`cdk synth`, __dirname);
    console.log(cloudFormationResult);
  })
  .catch((err) => {
    console.error(err);
  });
