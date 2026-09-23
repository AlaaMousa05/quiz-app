import { domainErrorClass } from "./DomainError.js";

export class ForbiddenError extends domainErrorClass(403, "error.forbidden") {}
