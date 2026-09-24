import { domainErrorClass } from "./DomainError.js";

export class QuizLockedError extends domainErrorClass(409, "error.quizLocked") {}
