import { queryOnce } from "./getTemplate";
// import { marshall } from "@aws-sdk/util-dynamodb";
// import { unmarshall } from "@aws-sdk/util-dynamodb";
const test = async () => {
  //   const docWithNewKeyIdx = results.Items.length + numLeft;
  //   const docWithNewKey = unmarshall({ ...results.Items[docWithNewKeyIdx] });
  //   const docKey = marshall(docWithNewKey["pk"], {
  //     convertClassInstanceToMap: true,
  //     removeUndefinedValues: true,
  //   });
  const pk = {
    recordType: { S: "projects" },
    startDate: { S: "2021-07-15T06:39:32.000Z" },
  };
  const tableName = "RestApiStack-projects9614A9BB-193Y2K4NZV42C";
  const docPartitionKey = pk["recordType"];
    const docSortKey = pk["startDate"];
    const expression = `#partition = :partitionVal`
  //const expression = `#partition = :partitionVal and #sort = :sortVal`;
  const docWithKeyResult = await queryOnce({
    tableName,
    query: {
      TableName: tableName,
      KeyConditionExpression: expression,
      ExpressionAttributeNames: {
        "#partition": "recordType",
        //"#sort": "startDate",
      },
      ExpressionAttributeValues: {
        ":partitionVal": docPartitionKey,
        //":sortVal": docSortKey,
      },
      Limit: 1,
    },
  });
    return docWithKeyResult
};
test().then((e)=> console.log(e))