import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { UnauthorizedError } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

/// Maps thrown validation/Prisma errors onto status codes so route handlers stay flat.
export function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return fail(error.message, 401);
  }

  if (error instanceof ZodError) {
    return fail("Validation failed", 422, error.issues);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return fail("Resource already exists", 409);
    if (error.code === "P2025") return fail("Resource not found", 404);
    if (error.code === "P2003") return fail("Referenced resource does not exist", 400);
  }

  console.error(error);
  return fail("Internal server error", 500);
}
