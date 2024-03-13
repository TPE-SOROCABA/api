import { Exception } from "./Exception";

export abstract class ResponseHandler {
  static success<T>(data: T, statusCode: number = 200) {
    return {
      body: JSON.stringify(data),
      statusCode,
    };
  }

  static error(error: any) {
    console.error(error);
    if (error instanceof Exception) {
      const { message, statusCode } = error;
      return {
        body: JSON.stringify({ message }),
        statusCode,
      };
    }
   
    return {
      body: JSON.stringify({ message: "Internal Server Error" }),
      statusCode: 500,
    };
  }
}
