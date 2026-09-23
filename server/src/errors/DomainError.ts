export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  abstract readonly messageKey: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Builds a named DomainError subclass for a fixed HTTP status code, so each
 * error type stays its own class (instanceof-able, self-documenting at throw
 * sites) without repeating the same statusCode/messageKey boilerplate.
 */
export function domainErrorClass(statusCode: number, defaultMessageKey: string) {
  return class extends DomainError {
    readonly statusCode = statusCode;
    readonly messageKey: string;

    constructor(message: string, messageKey: string = defaultMessageKey) {
      super(message);
      this.messageKey = messageKey;
    }
  };
}
