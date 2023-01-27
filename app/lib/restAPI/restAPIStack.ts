import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import restAPIMap from "./restApiMap";
import { createApi } from "./utils/createApiTree";
import { createDatabase } from "./utils/createDatabase";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const api = createApi(this, restAPIMap);
    const hobbiesDb = createDatabase({
      stack: this,
      tableName: "hobbies",
      pkName: "imageId",
    });
    const projectsDb = createDatabase({
      stack: this,
      tableName: "projects",
      pkName: "projectId",
    });
  }
}
