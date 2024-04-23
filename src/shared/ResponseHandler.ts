import { Exception } from "./Exception";

export abstract class ResponseHandler {
  static success<T>(data: T, statusCode: number = 200) {
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(data),
      statusCode,
    };
  }

  static error(error: any) {
    console.error(error);
    if (error instanceof Exception) {
      const { message, statusCode } = error;
      return {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message }),
        statusCode,
      };
    }
   
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: "Internal Server Error" }),
      statusCode: 500,
    };
  }
}
