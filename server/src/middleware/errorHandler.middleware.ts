import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { DomainError } from "../errors/index.js";

export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({ message: err.message, messageKey: err.messageKey });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ message: "Invalid request.", messageKey: "error.validation" });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again.", messageKey: "error.generic" });
};
