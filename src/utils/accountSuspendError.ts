export class AccountSuspendedError extends Error {
  statusCode = 403;
  constructor(message = 'Your account has been suspended. Please contact support.') {
    super(message);
  }
}
