import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, message = "Operation successful", status = 200) {
  const body: ApiResponse<T> = { success: true, message, data };
  return NextResponse.json(body, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  errors?: Record<string, string[]>
) {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  return NextResponse.json(body, { status });
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return errorResponse("Validation failed", 422, errors);
}

export function notFoundResponse(message = "Resource not found") {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function serverErrorResponse(message = "Internal server error") {
  return errorResponse(message, 500);
}
