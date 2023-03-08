import { driveactivity_v2 } from "googleapis";

export const getDriveFileActivity = async({
  driveActivity,
  resourceId,
  action,
}: {
  driveActivity: driveactivity_v2.Driveactivity;
  resourceId: string;
  action: "DELETE" | "CREATE" | "RENAME" | "RESTORE";
}) => {
  const filter = `detail.action_detail_case:${action}`;
  const result = await driveActivity.activity.query({
    requestBody: {
      itemName: `items/${resourceId}`,
      filter: filter,
    },
  });
  return result.data.activities?.[0];
};

