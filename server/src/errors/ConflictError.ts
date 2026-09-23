import { domainErrorClass } from "./DomainError.js";

export class ConflictError extends domainErrorClass(409, "error.conflict") {}
