import { ChildProcess, spawn, exec } from "child_process";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const psTree = require("ps-tree");
const nodemon = require("nodemon");
const script = `npm run synth`;
const checkTypes = `npm run check-types`;
//configure nodemon
nodemon({
  delay: 3000,
  exec: checkTypes,
  noDefaults: true,
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
const killProcess = (pid?: number) =>
  psTree(pid, (err: Error, children: any[]) => {
    try {
      spawn(
        "kill",
        ["-9"].concat(
          children.map(function (p) {
            return p.PID;
          })
        )
      );
    } catch (err) {}
    try {
      spawn("rm", ["-rf", "cdk.out"]);
    } catch (err) {}
  });
let synthProcess: ChildProcess | null = null;
function synthCommand() {
  return new Promise((resolve, reject) => {
    if (synthProcess) killProcess(synthProcess.pid);
    synthProcess = exec(script, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      resolve({ stdout, stderr });
    });
  });
}
nodemon.on("start", async () => {
  try {
    if (synthProcess) killProcess(synthProcess.pid);
    await synthCommand();
  } catch (err) {
    console.log(err);
  }
});
nodemon.on("restart", async (files: string[]) => {
  try {
    await synthCommand();
  } catch (err) {
    console.log(err);
  }
});
