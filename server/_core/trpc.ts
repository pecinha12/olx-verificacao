import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";

export type Context = {
  req: Request;
  res: Response;
  user: null;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
