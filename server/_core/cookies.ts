import type { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: req.protocol === "https",
    sameSite: "lax" as const,
    path: "/",
  };
}
