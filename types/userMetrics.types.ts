export enum METRIC_TYPE {
  PERSONAL = "personal",
}
export type GithubData = {
  repositories: number;
  contributions: number;
};
export type StackOverflowData = {
  reputation: string;
  peopleReached: string;
};
export type UserMetricDocument = {
  metricType: METRIC_TYPE;
  githubData: GithubData;
  stackOverflowData: StackOverflowData;
  dateModified: string;
};
