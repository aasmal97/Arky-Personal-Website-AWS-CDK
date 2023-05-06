import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
export const deleteImgFromS3 = async (bucketName: string, key: string) => {
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
export const uploadImgToS3 = async ({
  bucketName,
  key,
  body,
}: {
  bucketName: string;
  key: string;
  body: any;
}) => {
  const client = new S3Client({
    region: "us-east-1",
  });
  const input: PutObjectCommandInput = {
    Key: key,
    Bucket: bucketName,
    Body: body,
  };
  const command = new PutObjectCommand(input);
  const response = await client.send(command);
  return response;
};
