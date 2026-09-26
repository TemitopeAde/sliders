import type { APIRoute, APIContext } from "astro";
import { auth } from "@wix/essentials";
import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export interface TokenInfo {
  active: boolean;
  subjectType: "APP" | "USER" | "MEMBER" | "VISITOR" | "UNKNOWN";
  subjectId: string;
  exp: number;
  iat: number;
  clientId?: string;
  siteId: string;
  instanceId?: string;
}
export async function identity(admin = true): Promise<TokenInfo> {
  let token: TokenInfo;
  try {
    token = (await auth.getTokenInfo()) as TokenInfo;
  } catch {
    throw new ApiError(401, "UNAUTHENTICATED", "Open this app from your Wix site.");
  }
  if (!token.active || !token.siteId)
    throw new ApiError(
      401,
      "UNAUTHENTICATED",
      "Open this app from your Wix site.",
    );
  if (admin && token.subjectType !== "USER")
    throw new ApiError(
      403,
      "FORBIDDEN",
      "A site administrator must perform this action.",
    );
  return token;
}
export const ok = (data: unknown, message = "Success", status = 200) =>
  Response.json(
    { success: true, data, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
export function route(
  handler: (ctx: APIContext) => Promise<unknown>,
  admin = true,
): APIRoute {
  return async (ctx) => {
    try {
      await identity(admin);
      const data = await handler(ctx);
      return data instanceof Response ? data : ok(data);
    } catch (error) {
      if (error instanceof z.ZodError)
        return Response.json(
          {
            success: false,
            error: "VALIDATION_ERROR",
            message: "Please correct the highlighted fields",
            errors: error.flatten(),
          },
          { status: 400 },
        );
      if (error instanceof ApiError)
        return Response.json(
          { success: false, error: error.code, message: error.message },
          { status: error.status },
        );
      if (error instanceof SyntaxError)
        return Response.json(
          {
            success: false,
            error: "VALIDATION_ERROR",
            message: "Invalid JSON body",
          },
          { status: 400 },
        );
      console.error("Slider API request failed", ctx.url.pathname, error);
      const code =
        typeof error === "object" && error !== null && "httpStatus" in error
          ? Number(error.httpStatus)
          : 500;
      return Response.json(
        {
          success: false,
          error: code === 403 ? "FORBIDDEN" : "INTERNAL_ERROR",
          message:
            code === 403
              ? "You do not have permission to make this change."
              : "Something went wrong. Please try again.",
        },
        { status: code === 403 ? 403 : 500 },
      );
    }
  };
}
export async function body(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > 1_000_000)
    throw new ApiError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Slider content exceeds the size limit.",
    );
  return JSON.parse(text);
}
export const idParam = (value: string | undefined) =>
  z.string().min(1).max(100).parse(value);
