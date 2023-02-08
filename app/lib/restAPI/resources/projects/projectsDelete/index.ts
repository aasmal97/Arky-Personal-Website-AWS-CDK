import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { deleteTemplate } from "../../../../utils/apiTemplates/deleteTemplate";
const convertToAttributeStr = (s: any) => ({
  S: typeof s === "string" ? s : "",
});

const deleteProjectImgFromS3 = async (key: string) => {
  const bucketName = process.env.S3_MEDIA_FILES_BUCKET_NAME;
  const client = new S3Client({
    region: "us-east-1",
  });
  const input: DeleteObjectCommandInput = {
    Key: key,
    Bucket: bucketName,
  };
  const command = new DeleteObjectCommand(input);
  const response = await client.send(command);
  return response;
};
export async function handler(
  e: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  if (e.httpMethod !== "DELETE")
    return {
      statusCode: 405,
      body: "Wrong http request",
    };
  const params = e.queryStringParameters;
  if (!params)
    return {
      statusCode: 400,
      body: "You must provide the id of the resource you want to delete",
    };
  const { id, placeholderSrc, src } = params;
  if (!id)
    return {
      statusCode: 400,
      body: "You must provide the id of the resource you want to delete",
    };
  const document: Record<string, AttributeValue> = {
    id: convertToAttributeStr(id),
  };
  //delete record in dyanmo db table
  const result = await deleteTemplate({
    document,
    tableName: "projects",
    successMessage: "deleted record from projects",
  });
  if (result.statusCode !== 200) return result;
  //delete images referenced in projects
  //this is optional and only occurs if src and placeholder src are provided
  const promiseArr = [];
  if (!src && !placeholderSrc)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "deleted record from projects",
        document: document,
      }),
    };
  if (src) promiseArr.push(deleteProjectImgFromS3(src));
  if (placeholderSrc) promiseArr.push(deleteProjectImgFromS3(placeholderSrc));
  try {
    const deleteImgResult = await Promise.all(promiseArr);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "deleted project and media from projects table",
        document: document,
      }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "deleted record from projects, but could not delete media files",
        document: document,
        mediaErrKeys: [src, placeholderSrc],
        mediaErr: e,
      }),
    };
  }
}
