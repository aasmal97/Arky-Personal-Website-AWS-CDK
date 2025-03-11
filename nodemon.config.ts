import { exec } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemon = require("nodemon");
const script = `npm run synth`;
const checkTypes = `npm run check-types`;
//configure nodemon
nodemon({
  delay: 2000,
  exec: script,
  noDefaults: true,
  // verbose: true,
  watch: ["*"],
  ext: "ts, js",
  ignoreRoot: [
    ".git",
    ".vscode",
    "dist",
    ".aws-sam",
    ".next",
    ".vercel",
    "**/coverage/**/*",
    "**/cdk.out/**/*",
    "**/node_modules/**/*",
    "nodemon.config.ts",
    "package-lock.json",
  ],
});
export function execCommand(command: string) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
nodemon.on("restart", async (files: string[]) => {
  console.log("App restarted due to: ", files);
  await execCommand(checkTypes);
});
