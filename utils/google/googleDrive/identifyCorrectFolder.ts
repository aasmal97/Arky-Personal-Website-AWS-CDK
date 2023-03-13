import { drive_v3 } from "googleapis";
const identifyCorrectFolder = async (
  drive: drive_v3.Drive,
  arr: (string | null | undefined)[],
  matchName: string
) => {
  const promiseArr = arr.map((str) =>
    typeof str === "string"
      ? drive.files.get({
          fileId: str,
          fields: "id,parents,name",
        })
      : null
  );
  const results = await Promise.all(promiseArr);
  for (let r in results) {
    const currFile = results[r]?.data;
    if (!currFile) continue;
    if (currFile.name === matchName) return r;
  }
  return undefined;
};
export default identifyCorrectFolder;
