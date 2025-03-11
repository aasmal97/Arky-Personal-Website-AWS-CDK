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
  name?: string;
};
export type PDFDocument = {
  pk?: {
    recordType: "projects";
    startDate: string;
    dateCreated: string;
  };
  googleResourceId?: string | null;
  name?: string | null;
  slidesURL?: string | null;
};
export type ProjectDocument = {
  pk: {
    recordType: "projects";
    startDate: string;
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
  slidesURL?: string | null;
  slidesGoogleResourceId?: string | null;
  slidesFileName?: string | null;
};
export function isPDFDocument(e: any): e is PDFDocument {
  try {
    return !e.slidesURL;
  } catch {
    return false;
  }
}
