export type Image = {
  imgDescription: string;
  imgURL: string;
  placeholderURL: string;
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
};
