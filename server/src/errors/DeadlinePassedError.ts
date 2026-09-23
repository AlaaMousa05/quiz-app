import { domainErrorClass } from "./DomainError.js";

export class DeadlinePassedError extends domainErrorClass(409, "error.deadlinePassed") {}
