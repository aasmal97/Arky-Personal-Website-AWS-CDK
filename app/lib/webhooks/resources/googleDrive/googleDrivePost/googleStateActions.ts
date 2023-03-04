import { RequestProps } from "."
import { convertToStr } from "../../../../../../utils/general/convertToStr";
import { S3Client, DeleteObjectCommand, DeleteObjectCommandInput } from "@aws-sdk/client-s3";
const getDriveFileDetials = ({
    resourceId, 
    action
}:{ resourceId?: string, action: "DELETE" | "CREATE" | "RENAME" | "RESTORE" | "PERMISSIONCHANGE" }) => {
    const filter = `detail.action_detail_case:DELETE`
}
const deleteImgFromS3 = async (bucketName: string, key: string) => {
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
export const removeResource = (resourceId: RequestProps["resourseId"]) => {
    const bucketName = convertToStr(process.env.S3_MEDIA_FILES_BUCKET_NAME);
    // const resourceDetails = 
    // //const parentFolder = 
    // // const 
    // const deleteObj = deleteImgFromS3(bucketName, )
};
// const deleteProjectImgFromS3 = async (key: string) => {
//   const bucketName = process.env.S3_MEDIA_FILES_BUCKET_NAME;
//   const client = new S3Client({
//     region: "us-east-1",
//   });
//   const input: DeleteObjectCommandInput = {
//     Key: key,
//     Bucket: bucketName,
//   };
//   const command = new DeleteObjectCommand(input);
//   const response = await client.send(command);
//   return response;
// };
// //delete images referenced in projects
// //this is optional and only occurs if src and placeholder src are provided
// const promiseArr = [];
// if (!src && !placeholderSrc)
//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       message: "deleted record from projects",
//       document: document,
//     }),
//   };
// if (src) promiseArr.push(deleteProjectImgFromS3(src));
// if (placeholderSrc) promiseArr.push(deleteProjectImgFromS3(placeholderSrc));
// try {
//   const deleteImgResult = await Promise.all(promiseArr);
//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       message: "deleted project and media from projects table",
//       document: document,
//     }),
//   };
// } catch (e) {
//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       message:
//         "deleted record from projects, but could not delete media files",
//       document: document,
//       mediaErrKeys: [src, placeholderSrc],
//       mediaErr: e,
//     }),
//   };
// }