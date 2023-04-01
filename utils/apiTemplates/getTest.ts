// import { queryOnce } from "./getTemplate";
// import { marshall } from "@aws-sdk/util-dynamodb";
// import { unmarshall } from "@aws-sdk/util-dynamodb";
// const test = async () => {
//   //   const docWithNewKeyIdx = results.Items.length + numLeft;
//   //   const docWithNewKey = unmarshall({ ...results.Items[docWithNewKeyIdx] });
//   //   const docKey = marshall(docWithNewKey["pk"], {
//   //     convertClassInstanceToMap: true,
//   //     removeUndefinedValues: true,
//   //   });
//   const pk = {
//     recordType: { S: "projects" },
//     dateCreated: { S: "2023-03-29T12:00:20.118Z" },
//   };
//   const tableName = "RestApiStack-projects9614A9BB-193Y2K4NZV42C";
//   const docPartitionKey = pk["recordType"];
//   const docSortKey = pk["dateCreated"];
//   const expression = `#partition = :partitionVal and #sort = :sortVal`;
//   const docWithKeyResult = await queryOnce({
//     tableName,
//     query: {
//       TableName: tableName,
//       KeyConditionExpression: expression,
//       ExpressionAttributeNames: {
//         "#partition": "recordType",
//         "#sort": "startDate",
//       },
//       ExpressionAttributeValues: {
//         ":partitionVal": docPartitionKey,
//         ":sortVal": docSortKey,
//       },
//       Limit: 1,
//     },
//   });
// };
