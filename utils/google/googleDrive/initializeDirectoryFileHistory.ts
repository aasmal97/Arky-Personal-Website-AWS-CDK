import { APIGatewayProxyResult } from "aws-lambda";
import {
  searchForFileByChildResourceId,
  searchForFilesByDirectParent,
} from "../../../utils/google/googleDrive/searchForFolder";
import { ChannelDocument } from "../../../utils/google/googleDrive/watchChannels/createWatchChannel";
import { getDocuments } from "../../../utils/crudRestApiMethods/getMethod";
import { ProjectDocument } from "../../../app/lib/restAPI/resources/types/projectTypes";
import { getWatchChannels } from "../../../utils/google/googleDrive/watchChannels/getWatchChannels";
import { drive_v3 } from "googleapis";
import { Image } from "../../../app/lib/restAPI/resources/types/projectTypes";
export type InitializeFileHistoryProps = {
  prevFilesInFolder: (
    | {
        id: string | undefined;
        data: Image;
      }
    | {
        id: string;
        data: ChannelDocument;
      }
  )[];
  currFilesInFolder: drive_v3.Schema$File[];
};
export const initializeDirectoryFileHistory = async ({
  drive,
  resourceId,
  restApiKey,
  restApiUrl,
  topMostDirectoryId,
  webhooksTableName,
}: {
  drive: drive_v3.Drive;
  resourceId: string;
  restApiKey: string;
  restApiUrl: string;
  topMostDirectoryId: string;
  webhooksTableName: string;
}): Promise<APIGatewayProxyResult | InitializeFileHistoryProps> => {
  const { file: directoryFile } = await searchForFileByChildResourceId(
    drive,
    resourceId,
    false
  );
  const currFilesInFolderPromise = searchForFilesByDirectParent(
    drive,
    resourceId
  );
  const projectDocPromise = getDocuments({
    apiKey: restApiKey,
    restApiUrl,
    addedRoute: "projects",
    params: {
      query: JSON.stringify({
        recordType: "projects",
        projectName: directoryFile.name,
        getImages: true,
        max: 1,
      }),
    },
  });
  const activeChannelsPromise = getWatchChannels({
    primaryKey: {
      topMostDirectory: topMostDirectoryId,
    },
    tableName: webhooksTableName,
    parentDirectoryId: directoryFile.id,
  });
  //get data needed to seperate directories from media files
  //and create a changelog to see what items were added
  //and which ones were deleted
  const [activeChannelsInDirectory, currFilesInFolder, projectDoc] =
    await Promise.all([
      activeChannelsPromise,
      currFilesInFolderPromise,
      projectDocPromise,
    ]);
  const activeChannelsParsed = JSON.parse(activeChannelsInDirectory.body);
  const activeChannels = activeChannelsParsed.result
    .Items as ChannelDocument[];
  const projectDocs = projectDoc.data?.result?.Items as
    | ProjectDocument[]
    | undefined;
  let projectDocument: Partial<ProjectDocument> = {
    images: [],
  };
  if (projectDocs && projectDocs.length > 0) projectDocument = projectDocs[0]
  // if (!projectDocument)
  //   return {
  //     statusCode: 200,
  //     body: `Project doc matching google drive directory name ${ directoryFile.name} does not exist`,
  //   };
  const projectDocImages = projectDocument.images ? projectDocument.images : [];
  const projectDocImagesIds = projectDocImages.map((img) => ({
    id: img.googleResourceId,
    data: img,
  }));
  const activeChannelDirectoryIds = activeChannels.map((channel) => ({
    id: channel.id,
    data: channel,
  }));
  const prevFilesInFolder = [
    ...projectDocImagesIds,
    ...activeChannelDirectoryIds,
  ];
  return {
    prevFilesInFolder,
    currFilesInFolder: currFilesInFolder ? currFilesInFolder : [],
  };
};
