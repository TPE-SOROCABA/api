import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Exception } from "./Exception";

	
const ALLOWED_ORIGINS = [
	process.env.FRONTEND_URL,
];
 

export class ResponseHandler {
  constructor(private event: any) {}
  success<T>(data: T, statusCode: number = 200) {
    return {
      headers: getHeaders(getOrigin(this.event)),
      body: JSON.stringify(data),
      statusCode,
    };
  }

  error(error: any) {
    console.error(error);
    if (error instanceof Exception) {
      const { message, statusCode } = error;
      return {
        headers: getHeaders(getOrigin(this.event)),
        body: JSON.stringify({ message }),
        statusCode,
      };
    }
   
    return {
      headers: getHeaders(getOrigin(this.event)),
      body: JSON.stringify({ message: "Internal Server Error" }),
      statusCode: 500,
    };
  }
}


function isOriginAllowed(origin?: string) {
  return ALLOWED_ORIGINS.includes(origin);
}

function getOrigin(event: APIGatewayProxyEventV2) {
  return event.headers.origin;
}

function getHeaders(origin?: string) {
  if (isOriginAllowed(origin) && origin) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': true,
    };
  }
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  }
}