import { domainErrorClass } from "./DomainError.js";

export class UnauthorizedError extends domainErrorClass(401, "error.unauthorized") {}
