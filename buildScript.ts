import { execShellCommand } from "@utils/buildFuncs/execShellCommand";
execShellCommand(`tsc`, __dirname)
  .then(async (e) => {
    console.log(e);
    const hostingBundleResult = await execShellCommand(
      `npx ts-node ./lib/hosting/hostingBundleApiFuncs.ts`,
      __dirname
    );
    console.log(hostingBundleResult);
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
    const cloudFormationResult = await execShellCommand(
      `npx cdk synth`,
      __dirname
    );
    console.log(cloudFormationResult);
    const cloudBootstrap = await execShellCommand(
      "npx cdk bootstrap",
      __dirname
    );
    console.log(cloudBootstrap);
  })
  .catch((err) => {
    console.error(err);
  });
