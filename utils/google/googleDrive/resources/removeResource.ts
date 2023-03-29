import { deleteDocument } from "../../../crudRestApiMethods/deleteMethod";
import { deleteImgFromS3 } from "../../../general/s3Actions";

export const removeResource = async ({
  restApiUrl,
  apiKey,
  bucketName,
  resourceId,
}: {
  restApiUrl: string;
  apiKey: string;
  bucketName: string;
  resourceId: string;
}) => {
  const resourceDetails = deleteDocument({
    restApiUrl,
    apiKey,
    addedRoute: "projects/images",
    params: {
      googleResourceId: resourceId,
    },
  });
  const deleteObj = deleteImgFromS3(bucketName, resourceId);
  return await Promise.all([deleteObj, resourceDetails]);
};
