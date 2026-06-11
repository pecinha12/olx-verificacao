import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const handler = createExpressMiddleware({
  router: appRouter,
  createContext: ({ req, res }: any) => ({ req, res, user: null }),
});

export default function (req: VercelRequest, res: VercelResponse) {
  return handler(req as any, res as any, () => {});
}
