class HttpError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = 500;
  }
}

class UserExistsError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'UserExistsError';
    this.statusCode = 409;
  }
}

class DocumentExistsError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'DocumentExistsError';
    this.statusCode = 409;
  }
}

class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 401;
  }
}

class NotFoundError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class BadRequestError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

class InvalidInputError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
    this.statusCode = 422;
  }
}
class ValidationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 422;
  }
}

const ERROR = {
  HttpError,
  DocumentExistsError,
  UserExistsError,
  NotFoundError,
  BadRequestError,
  InvalidInputError,
  AuthorizationError,
  ValidationError,
};

export default ERROR;
