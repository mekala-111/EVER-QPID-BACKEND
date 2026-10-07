import ERROR from '../middlewares/web_server/http-error';
import jwt from 'jsonwebtoken';

/**
 * Validates if the user is authorized by checking if userId exists
 * @param {string | undefined} userId
 * @throws {ERROR.AuthorizationError}
 */
// export const validateUserAuthorization = (userId?: string): void => {
//   if (!userId) {
//     throw new ERROR.AuthorizationError('Unauthorized');
//   }
// };

export const validateUserAuthorization = (userId?: string, token?: string): void => {
  if (!userId) throw new ERROR.AuthorizationError('Unauthorized');

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      if (decoded.sub !== userId) {
        throw new ERROR.AuthorizationError('Unauthorized');
      }
    } catch (err) {
      throw new ERROR.AuthorizationError('Invalid token');
    }
  }
};

/**
 * Throws a "Not Found" error for the given resource if it does not exist
 * @param {any} resource
 * @param {string} resourceName
 * @throws {ERROR.NotFoundError}
 */
// export const validateNotFound = (resource: any, resourceName: string): void => {
//   if (!resource) {
//     throw new ERROR.NotFoundError(`${resourceName} not found`);
//   }
// };

export function validateNotFound<T>(resource: T, resourceName: string): asserts resource is NonNullable<T> {
  if (!resource) {
    throw new ERROR.NotFoundError(`${resourceName} not found`);
  }
}

/**
 * Throws a "Bad Request" error if the provided data is invalid
 * @param {boolean} condition
 * @param {string} message
 * @throws {ERROR.BadRequestError}
 */
export const validateBadRequest = (condition: boolean, message: string): void => {
  if (condition) {
    throw new ERROR.BadRequestError(message);
  }
};

/**
 * Validates if the user exists by checking the user data
 * @param {any} user
 * @throws {ERROR.UserExistsError}
 */
export const validateUserExists = (user: any): void => {
  if (user) {
    throw new ERROR.UserExistsError('Username already exists');
  }
};

/**
 * Validates if the document exists by checking the document
 * @param {any} document
 * @param {string} message
 * @throws {ERROR.DocumentExistsError}
 */
export const validateDocumentExists = (document: any, message: string): void => {
  if (document) {
    throw new ERROR.DocumentExistsError(`${message} already exists`);
  }
};

/**
 * Validates if a specific field is present and non-empty
 * @param {string | undefined | null} field - The value to validate
 * @param {string} fieldName
 * @throws {Error.ValidationError}
 */
export const validateRequiredField = (field: string | undefined | null | number | Date, fieldName: string): void => {
  if (!field) {
    throw new ERROR.ValidationError(`${fieldName} is required`);
  }
};

/**
 * Validates if the age field is present, a valid number, and at least 18.
 * @param {number | undefined | null} age - The age value to validate.
 * @param {string} fieldName - The name of the field being validated (e.g., "age").
 * @throws {Error.ValidationError} If age is missing, not a valid number, or less than 18.
 */
export const validateAge = (age: number | undefined | null, fieldName: string): void => {
  if (age === undefined || age === null) {
    throw new ERROR.ValidationError(`${fieldName} is required`);
  }
  if (typeof age !== 'number' || isNaN(age)) {
    throw new ERROR.ValidationError(`${fieldName} must be a valid number`);
  }
  if (age < 18) {
    throw new ERROR.ValidationError(`${fieldName} must be at least 18`);
  }
};
