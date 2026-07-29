export class AppError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 400, errors?: Record<string, string[]>) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>, message = "Validation failed") {
    super(message, 422, errors);
    this.name = "ValidationError";
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors,
    };
  }

  console.error("Unhandled error:", error);
  return {
    message: "Internal server error",
    statusCode: 500,
  };
}
