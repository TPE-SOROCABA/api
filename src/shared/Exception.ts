export class Exception extends Error {
  statusCode: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.message = message;
    this.statusCode = status;
  }
}
