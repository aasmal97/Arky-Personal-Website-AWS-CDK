import path = require("path");
import * as dotenv from "dotenv";
export const searchForSecrets = (strPath: string): dotenv.DotenvConfigOutput => {
    try {
      if (strPath.length <= 0) return {};
      //this is here to ensure all environment variables are reached
      //in github action runner or when deploying locally
      const pathToENV = path.resolve(strPath, ".env");
      const currConfig = dotenv.config({
        path: pathToENV,
      });
      if (currConfig.parsed) return currConfig.parsed;
      else {
        const newPath = path.resolve(strPath, "..");
        //we've reached the root directory
        if (newPath === strPath) return {};
        return searchForSecrets(newPath);
      }
    } catch (err) {
      console.error(err);
      return {};
    }
  };
  export const searchForSecretsWrapper = (dirname: string) => {
    let obj: { [key: string]: string | undefined } = {};
    const currConfig = searchForSecrets(dirname);
    const currProcess = process.env;
    obj = { ...currProcess, ...currConfig.parsed };
    return obj
  }