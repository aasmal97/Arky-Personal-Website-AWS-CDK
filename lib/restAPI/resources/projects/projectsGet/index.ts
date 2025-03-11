import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import {
  getTemplate,
  SuccessResponseProps,
} from "@utils/apiTemplates/getTemplate";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Image, ProjectDocument } from "@app/types";
import { getDocuments } from "@utils/crudRestApiMethods/getMethod";
import { convertToStr } from "@utils/general/convertToStr";
import { validateGeneralGetQuery } from "@utils/apiTemplates/generateDynamoQueries";
import { corsHeaders } from "@restAPI/resources/utils/corsLambda";
export type ProjectQueryProps = {
  recordType: "projects";
  id?: string;
  appURL?: string;
  projectName?: string;
  description?: string;
  startDate?: string;
  sortBy?: {
    startDate?: 1 | -1;
    endDate?: 1 | -1;
  };
};

function isProjectQueryProps(e: any): e is ProjectQueryProps {
  try {
    return e.recordType;
  } catch (err) {
    return false;
  }
}
const generateGetExpression = (query: ProjectQueryProps) => {
  let expression = `#recordTypeAtt = :recordTypeVal`;
  let filterExpArr: string[] = [];
  let scanDirection = true;
  let index: string | undefined;
  const expAttr: Record<string, any> = {
    "#recordTypeAtt": "recordType",
  };
  const expValMap: Record<string, any> = {
    ":recordTypeVal": "projects",
  };
  const { id, appURL, projectName, description, sortBy, startDate } = query;
  //this is the sort key
  if (typeof startDate === "string") {
    expression += ` AND #startDateAtt = :startDateVal`;
    expAttr["#startDateAtt"] = "startDate";
    expValMap[":startDateVal"] = startDate;
  }
  const addParamater = (
    key: string,
    value: any,
    expType: "contains" | "equals"
  ) => {
    const expKey = `#${key}`;
    const expKeyVal = `:${key}val`;
    expAttr[expKey] = key;
    expValMap[expKeyVal] = value;
    const containsExp = `contains(${expKey}, ${expKeyVal})`;
    const equalExp = `${expKey} = ${expKeyVal}`;
    filterExpArr.push(expType === "contains" ? containsExp : equalExp);
  };

  if (typeof id === "string") addParamater("id", id, "equals");

  if (typeof projectName === "string")
    addParamater("projectName", projectName, "contains");
  if (typeof description === "string")
    addParamater("description", description, "contains");
  if (typeof appURL === "string") addParamater("appURL", appURL, "contains");

  if (sortBy) {
    const startDate = sortBy.startDate;
    const endDate = sortBy.endDate;
    if (startDate === -1) scanDirection = false;
    if (!startDate && endDate === -1) scanDirection = false;
    if (!startDate && endDate) {
      index = "SortByDateEnded";
    }
  }
  const expVal = marshall(expValMap, {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  });
  const filterExp =
    filterExpArr.length > 0
      ? filterExpArr.reduce((a, b) => a + " AND " + b)
      : undefined;
  return {
    keyExp: expression,
    expVal,
    expAttr,
    filterExp,
    scanDirection,
    index,
  };
};
const generateQuery = (e: APIGatewayEvent): QueryCommandInput | null => {
  const result = validateGeneralGetQuery(e);
  if (!result) return result;
  const { parsedStartKey, parsedQuery } = result;
  if (!isProjectQueryProps(parsedQuery)) return null;
  const { keyExp, expVal, expAttr, filterExp, scanDirection, index } =
    generateGetExpression(parsedQuery);
  const dynamoQuery: QueryCommandInput = {
    TableName: convertToStr(process.env.AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME),
    KeyConditionExpression: keyExp,
    FilterExpression: filterExp,
    ExpressionAttributeNames: expAttr,
    ExpressionAttributeValues: expVal,
    ExclusiveStartKey: parsedStartKey,
    ScanIndexForward: scanDirection,
    IndexName: index,
  };
  return dynamoQuery;
};
const fetchImagesWithDocs = async (projectDocsRes: APIGatewayProxyResult) => {
  //fetch images associated with documents
  const parsedProjectDocs: SuccessResponseProps = JSON.parse(
    projectDocsRes.body
  );
  if (!parsedProjectDocs.result.Items) return projectDocsRes;
  const docsPromiseArr: Promise<ProjectDocument & { images: Image[] }>[] =
    parsedProjectDocs.result.Items.map((e) => {
      const newType = e as unknown;
      const doc = newType as ProjectDocument;
      const id = doc.id;
      const promise = async () => {
        const images = await getDocuments({
          restApiUrl: convertToStr(process.env.AMAZON_REST_API_DOMAIN_NAME),
          apiKey: convertToStr(process.env.AMAZON_REST_API_KEY),
          params: {
            query: {
              documentId: id,
            },
          },
          addedRoute: "/projects/images",
        });
        return {
          ...doc,
          images: images.data.result.Items,
        };
      };
      return promise();
    });
  const newDocs = await Promise.all(docsPromiseArr);
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      ...parsedProjectDocs,
      result: newDocs,
    }),
  };
};
export async function handler(event: APIGatewayEvent) {
  const projectDocsRes = await getTemplate({
    e: event,
    tableName: convertToStr(process.env.AMAZON_DYNAMO_DB_PROJECT_TABLE_NAME),
    successMessage: "Retrieved project results",
    generateQuery,
    partitionKey: "recordType",
    sortKey: "startDate",
  });
  const params = event.queryStringParameters;
  if (!params) return projectDocsRes;
  const { getImages } = params;
  if (projectDocsRes.statusCode !== 200 || !getImages) return projectDocsRes;
  return await fetchImagesWithDocs(projectDocsRes);
}
