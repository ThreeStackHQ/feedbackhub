// Custom error classes for API responses

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Centralized error handler for API routes
 * Converts errors to proper HTTP responses
 */
export function handleError(error: unknown) {
  const { NextResponse } = require('next/server');

  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error && 'issues' in error) {
    // Zod validation error
    return NextResponse.json(
      { error: 'Validation failed', details: (error as any).issues },
      { status: 400 }
    );
  }

  // Unknown error
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
