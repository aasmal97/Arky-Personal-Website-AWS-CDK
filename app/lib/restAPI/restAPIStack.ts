import * as cdk from "aws-cdk-lib";
import { AttributeType, ProjectionType } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import restAPIMap from "./restApiMap";
import { createApi } from "./utils/createApiTree";
import { createDatabase } from "./utils/createDatabase";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const hobbiesDb = createDatabase({
      stack: this,
      tableName: "hobbies",
      pkName: "orientation",
      sortKey: "dateCreated",
      secondaryIndex: {
        indexName: "SortByDateTaken",
        sortKey: {
          name: "dateTaken",
          type: AttributeType.STRING,
        },
        projectionType: ProjectionType.ALL,
      },
    });
    hobbiesDb.tableArn;
    hobbiesDb.tableName;
    const projectsDb = createDatabase({
      stack: this,
      tableName: "projects",
      pkName: "recordType",
      sortKey: "startDate",
      secondaryIndex: {
        indexName: "SortByDateEnded",
        sortKey: {
          name: "endDate",
          type: AttributeType.STRING,
        },
        projectionType: ProjectionType.ALL,
      },
    });
    const tablesMap = {
      hobbies: {
        id: hobbiesDb.tableName,
        arn: hobbiesDb.tableArn,
      },
      projects: {
        id: projectsDb.tableName,
        arn: projectsDb.tableArn,
      },
    };
    const api = createApi(this, restAPIMap(this, tablesMap));
  }
}
