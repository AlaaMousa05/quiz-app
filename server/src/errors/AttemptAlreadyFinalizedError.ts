import { domainErrorClass } from "./DomainError.js";

export class AttemptAlreadyFinalizedError extends domainErrorClass(410, "error.attemptFinalized") {}
