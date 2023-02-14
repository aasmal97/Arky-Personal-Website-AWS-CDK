import { execShellCommand } from "../utils/buildFuncs/execShellCommand";
execShellCommand(`tsc`, __dirname)
  .then(async (e) => {
    console.log(e);
    const bundleResult = await execShellCommand(
      `npx ts-node ./lib/restAPI/bundleApiFuncs.ts`,
      __dirname
    );
    console.log(bundleResult);
    const webhooksBundleResult = await execShellCommand(
      `npx ts-node ./lib/webhooks/webhooksBundleApiFuncs.ts`,
      __dirname
    );
    console.log(webhooksBundleResult);
    const cloudFormationResult = await execShellCommand(`cdk synth`, __dirname);
    console.log(cloudFormationResult);
    const cloudBootstrap = await execShellCommand("cdk bootstrap", __dirname);
    console.log(cloudBootstrap);
  })
  .catch((err) => {
    console.error(err);
  });
