import { APIGatewayProxyResult } from "aws-lambda";
export function isAPIGatewayResult(e: any): e is APIGatewayProxyResult {
  return e.statusCode && e.body;
}