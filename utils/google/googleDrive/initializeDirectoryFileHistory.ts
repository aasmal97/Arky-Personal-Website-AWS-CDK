import { APIGatewayProxyResult } from "aws-lambda";
import {
  searchForFileByChildResourceId,
  searchForFilesByDirectParent,
} from "@utils/google/googleDrive/searchForFolder";
import { ChannelDocument } from "@utils/google/googleDrive/watchChannels/createWatchChannel";
import { getDocuments } from "@utils/crudRestApiMethods/getMethod";
import {
  PDFDocument,
  ProjectDocument,
} from "@restAPI/resources/utils/types/projectTypes";
import { getWatchChannels } from "@utils/google/googleDrive/watchChannels/getWatchChannels";
import { drive_v3 } from "googleapis";
import { Image } from "@restAPI/resources/utils/types/projectTypes";
import { determineCategoryType } from "./determineCategoryType";
import { convertToStr } from "../../general/convertToStr";
import { isAPIGatewayResult } from "../../general/isApiGatewayResult";
import { HobbiesDocument } from "@restAPI/resources/hobbies/hobbiesPut";
const topMostDirectoryFolderName = process.env.GOOGLE_DRIVE_FOLDER_NAME;
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
    | {
        id: string;
        data: HobbiesDocument;
      }
    | {
        id: string;
        data: PDFDocument;
      }
  )[];
  currFilesInFolder: drive_v3.Schema$File[];
};
const getHobbiesImages = async ({
  restApiKey,
  restApiUrl,
  verticalStartKey,
  horizontalStartKey,
}: {
  restApiKey: string;
  restApiUrl: string;
  verticalStartKey?: HobbiesDocument["pk"] | null;
  horizontalStartKey?: HobbiesDocument["pk"] | null;
}): Promise<APIGatewayProxyResult | [any, any]> => {
  const defaultData = {
    data: {
      result: {
        Count: 0,
        Items: [],
        LastEvaluatedKey: null,
      },
    },
  };
  let hobbiesVerticalPromise: any = defaultData;
  let hobbiesHorizontalPromise: any = defaultData;
  if (verticalStartKey || verticalStartKey === null)
    hobbiesVerticalPromise = getDocuments({
      apiKey: restApiKey,
      restApiUrl,
      addedRoute: "hobbies",
      params: {
        query: JSON.stringify({
          orientation: "vertical",
        }),
        max: 5000,
        startKey: JSON.stringify(verticalStartKey),
      },
    });
  if (horizontalStartKey || horizontalStartKey === null)
    hobbiesHorizontalPromise = getDocuments({
      apiKey: restApiKey,
      restApiUrl,
      addedRoute: "hobbies",
      params: {
        query: JSON.stringify({
          orientation: "horizontal",
        }),
        max: 5000,
        startKey: JSON.stringify(horizontalStartKey),
      },
    });
  const [hobbiesVertical, hobbiesHorizontal] = await Promise.all([
    hobbiesVerticalPromise,
    hobbiesHorizontalPromise,
  ]);
  if (!hobbiesVertical.data?.result || !hobbiesHorizontal.data?.result)
    return {
      statusCode: 500,
      body: "Error initializing hobbies history",
    };

  const vertical = hobbiesVertical.data.result;
  const horizontal = hobbiesHorizontal.data.result;
  return [vertical, horizontal];
};
export const getAllHobbiesImages = async ({
  restApiKey,
  restApiUrl,
}: {
  restApiKey: string;
  restApiUrl: string;
}): Promise<APIGatewayProxyResult | [HobbiesDocument[], HobbiesDocument[]]> => {
  let verticalLastKey: HobbiesDocument["pk"] | null | undefined = null;
  let horizontalLastKey: HobbiesDocument["pk"] | null | undefined = null;
  let verticalResult: HobbiesDocument[] = [];
  let horizontalResult: HobbiesDocument[] = [];
  while (verticalLastKey !== undefined || horizontalLastKey !== undefined) {
    const imageResult: APIGatewayProxyResult | [any, any] =
      await getHobbiesImages({
        restApiKey,
        restApiUrl,
        verticalStartKey: verticalLastKey,
        horizontalStartKey: horizontalLastKey,
      });
    if (isAPIGatewayResult(imageResult)) return imageResult;
    const [vertical, horizontal] = imageResult as [any, any];
    verticalLastKey = vertical.LastEvaluatedKey;
    horizontalLastKey = horizontal.LastEvaluatedKey;
    const verticalItems = vertical.Items as HobbiesDocument[];
    const horizontalItems = horizontal.Items as HobbiesDocument[];
    verticalResult = [...verticalResult, ...verticalItems];
    horizontalResult = [...horizontalResult, ...horizontalItems];
  }
  return [verticalResult, horizontalResult];
};

export const initializeHobbiesHistory = async ({
  drive,
  resourceId,
  restApiKey,
  restApiUrl,
  topMostDirectoryId,
  directoryFile,
}: {
  drive: drive_v3.Drive;
  resourceId: string;
  restApiKey: string;
  restApiUrl: string;
  topMostDirectoryId: string;
  directoryFile: drive_v3.Schema$File;
}) => {
  const hobbiesImagesPromise = getAllHobbiesImages({
    restApiKey,
    restApiUrl,
  });
  const currFilesInFolderPromise = searchForFilesByDirectParent(
    drive,
    resourceId
  );
  const [hobbiesImagesResult, currFilesInFolder] = await Promise.all([
    hobbiesImagesPromise,
    currFilesInFolderPromise,
  ]);
  if (isAPIGatewayResult(hobbiesImagesResult)) return hobbiesImagesResult;
  const [hobbiesVertical, hobbiesHorizontal] = hobbiesImagesResult;
  const hobbiesDocuments = [...hobbiesVertical, ...hobbiesHorizontal];
  // start logic
  const prevFiles = hobbiesDocuments.map((file) => {
    return {
      id: file.googleResourceId,
      data: file,
    };
  });
  return {
    prevFilesInFolder: prevFiles,
    currFilesInFolder: currFilesInFolder ? currFilesInFolder : [],
  };
};
export const initializeProjectsHistory = async ({
  drive,
  resourceId,
  restApiKey,
  restApiUrl,
  topMostDirectoryId,
  webhooksTableName,
  directoryFile,
}: {
  drive: drive_v3.Drive;
  resourceId: string;
  restApiKey: string;
  restApiUrl: string;
  topMostDirectoryId: string;
  webhooksTableName: string;
  directoryFile: drive_v3.Schema$File;
}) => {
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
    ?.Items as ChannelDocument[];
  const projectDocs = projectDoc.data?.result?.Items as
    | ProjectDocument[]
    | undefined;
  let projectDocument: Partial<ProjectDocument> = {
    images: [],
  };
  if (projectDocs && projectDocs.length > 0) projectDocument = projectDocs[0];
  const projectDocImages = projectDocument.images ? projectDocument.images : [];
  const projectDocImagesIds = projectDocImages.map((img) => ({
    id: img.googleResourceId,
    data: img,
  }));
  const activeChannelDirectoryIds = activeChannels.map((channel) => ({
    id: channel.id,
    data: channel,
  }));
  const { pk, slidesGoogleResourceId, slidesURL, slidesFileName } =
    projectDocument;
  const slidePDFArr: { id: string; data: PDFDocument }[] =
    slidesGoogleResourceId && pk
      ? [
          {
            id: slidesGoogleResourceId,
            data: {
              pk,
              googleResourceId: slidesGoogleResourceId,
              slidesURL: slidesURL,
              name: slidesFileName,
            },
          },
        ]
      : [];
  const prevFilesInFolder = [
    ...projectDocImagesIds,
    ...slidePDFArr,
    ...activeChannelDirectoryIds,
  ];
  return {
    prevFilesInFolder,
    currFilesInFolder: currFilesInFolder ? currFilesInFolder : [],
  };
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
  const fileData = await searchForFileByChildResourceId(
    drive,
    resourceId,
    false
  );
  const directoryFile = fileData.file;
  const category = await determineCategoryType({
    drive,
    fileData: fileData,
    topMostDirectoryFolderName: convertToStr(topMostDirectoryFolderName),
  });
  switch (category) {
    case "hobbies":
      return await initializeHobbiesHistory({
        drive,
        resourceId,
        restApiKey,
        restApiUrl,
        topMostDirectoryId,
        directoryFile,
      });
    case "projects":
      return await initializeProjectsHistory({
        drive,
        resourceId,
        restApiKey,
        restApiUrl,
        topMostDirectoryId,
        webhooksTableName,
        directoryFile,
      });
    default:
      return {
        statusCode: 400,
        body: "No matching directory types. Invalid folder",
      };
  }
};
