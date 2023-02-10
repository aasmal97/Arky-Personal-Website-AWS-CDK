import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
const getStackOverflowInfo = () => {
    // Define the API endpoint and user ID
    const endpoint = "https://api.stackexchange.com/2.3/users/{}?site=stackoverflow";
    const userId = 123456;
    return 
}
export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    if(event.httpMethod !=='GET') return {
        statusCode: 400, 
        body: "Wrong HTTP Method"
    }

    const stackOverflowData = process.env
    const githubData = process.env
  return{
    statusCode: 200,
    body: JSON.stringify([stackOverflowData, githubData])
  } 
}
