export type Image = {
  pk: {
    googleResourceId: string;
    documentId: string;
  };
  id: string;
  documentId: string;
  imgDescription: string;
  imgURL: string;
  placeholderURL?: string;
  width?: number;
  height?: number;
  googleResourceId?: string;
};
export type ProjectDocument = {
  pk: {
    recordType: "projects";
    dateCreated: string;
  };
  recordType: "projects";
  id: string;
  appURL?: string;
  images?: Image[];
  projectName: string;
  githubURL: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dateCreated: string;
  topics?: string[];
  archived?: boolean;
  repoOwner?: string;
};
