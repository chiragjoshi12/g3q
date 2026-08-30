import { ZodError } from 'zod';
import { AppError, ERROR_CODE, ERROR_MESSAGE } from '../utils/appError.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ code: ERROR_CODE.NOT_FOUND, message: 'Route not found.' });
};

/** Centralized error handler — always responds with { code, message }. */
export const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ code: error.code, message: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      code: ERROR_CODE.INVALID_REQUEST,
      message: ERROR_MESSAGE[ERROR_CODE.INVALID_REQUEST],
      details: error.flatten(),
    });
  }

  console.error(error);
  return res.status(500).json({ code: ERROR_CODE.UNKNOWN, message: ERROR_MESSAGE[ERROR_CODE.UNKNOWN] });
};

/** Wraps an async route handler so rejected promises reach errorHandler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
