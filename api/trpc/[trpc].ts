import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";

export default trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext: ({ req, res }: any) => ({ req, res, user: null }),
});
