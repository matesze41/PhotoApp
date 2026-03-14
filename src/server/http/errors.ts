export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly status: number;
  readonly code: AppErrorCode;

  constructor(params: { message: string; status: number; code: AppErrorCode }) {
    super(params.message);
    this.name = "AppError";
    this.status = params.status;
    this.code = params.code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  return new AppError({
    message: "Internal server error",
    status: 500,
    code: "INTERNAL_ERROR",
  });
}
