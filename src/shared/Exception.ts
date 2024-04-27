export class Exception extends Error {
  statusCode: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.message = message;
    this.statusCode = status;
  }
}

export class BadRequestException extends Exception {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedException extends Exception {
  constructor(message: string) {
    super(401, message);
  }
}

export class ForbiddenException extends Exception {
  constructor(message: string) {
    super(403, message);
  }
}

export class NotFoundException extends Exception {
  constructor(message: string) {
    super(404, message);
  }
}
