import { domainErrorClass } from "./DomainError.js";

export class NotFoundError extends domainErrorClass(404, "error.notFound") {}
