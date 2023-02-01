import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
const dynamoDb =new DynamoDBClient({
    region: "us-east-1"
});

export async function handler(event: APIGatewayEvent) {
  if (!event.queryStringParameters) return;
  const { id, creationDate, name } = event.queryStringParameters;
    //const if
  // Define parameters for the DynamoDB query
  const params = {
    TableName: "projects",
    // KeyConditionExpression:
    //   "#id = :idValue and #creationDate = :creationDateValue and #name = :nameValue",
    ExpressionAttributeNames: {
    //   "#id": "id",
    //   "#creationDate": "creationDate",
    //   "#name": "name",
    },
    ExpressionAttributeValues: {
    //   ":idValue": id,
    //   ":creationDateValue": creationDate,
    //   ":nameValue": name,
    }
  };
const command = new QueryCommand(params)
  try {
    // Perform the DynamoDB query
    const result = await dynamoDb.send(command);

    // Return the result
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
}
