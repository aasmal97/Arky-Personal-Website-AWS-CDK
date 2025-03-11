// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemon = require("nodemon");
const script = `npm run dev`;
//configure nodemon
nodemon({
    delay: 2000,
    exec: script,
    noDefaults: true,
    // verbose: true,
    watch: ["*"],
    ext: "ts, js, json",
    ignoreRoot: [
        ".git",
        ".vscode",
        "dist",
        ".aws-sam",
        ".next",
        ".vercel",
        "coverage",
        "cdk.out",
        "node_modules",
        "nodemon.config.ts",
    ],
})
