import { domainErrorClass } from "./DomainError.js";

export class ValidationError extends domainErrorClass(400, "error.validation") {}
