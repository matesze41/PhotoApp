import { toAppError } from "@/server/http/errors";

type RouteContext = { params?: Promise<Record<string, string>> };

type RouteHandler<TContext extends RouteContext = RouteContext> = (
  req: Request,
  ctx: TContext
) => Promise<Response> | Response;

export function withErrorHandling<TContext extends RouteContext = RouteContext>(
  handler: RouteHandler<TContext>
) {
  return async (req: Request, ctx: TContext): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const appError = toAppError(error);
      return Response.json(
        {
          code: appError.code,
          error: appError.message,
        },
        { status: appError.status, headers: { "Cache-Control": "no-store" } }
      );
    }
  };
}
