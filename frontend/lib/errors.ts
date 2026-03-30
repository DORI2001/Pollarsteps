/**
 * Error handling utilities for consistent error messages and logging
 */

export interface HTTPErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  status_code?: number;
}

export class AppError extends Error {
  public readonly statusCode?: number;
  public readonly detail?: string;

  constructor(
    message: string,
    statusCode?: number,
    detail?: string
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export function extractErrorMessage(error: unknown): string {
  // If it's already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's an AppError, use its message
  if (error instanceof AppError) {
    return error.detail || error.message;
  }

  // If it's a regular Error, use its message
  if (error instanceof Error) {
    return error.message;
  }

  // If it's an object with detail property
  if (
    typeof error === "object" &&
    error !== null &&
    "detail" in error &&
    typeof (error as any).detail === "string"
  ) {
    return (error as any).detail;
  }

  // If it's an object with message property
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }

  // Fallback
  return "An unexpected error occurred";
}

export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const message = extractErrorMessage(error);
  console.error(`[${context}] ${message}`, {
    error,
    ...additionalInfo,
  });
}

export function formatErrorForUser(error: unknown): string {
  const message = extractErrorMessage(error);
  // Capitalize first letter and ensure it ends with a period
  const formatted = message.charAt(0).toUpperCase() + message.slice(1);
  return formatted.endsWith(".") ? formatted : formatted + ".";
}
