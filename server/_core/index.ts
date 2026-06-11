import { createExpressMiddleware } from "@trpc/server/adapters/express";
import * as dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { appRouter } from "../routers";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => ({ req, res, user: null }),
    })
  );

  // Static files (produção)
  if (process.env.NODE_ENV === "production") {
    const staticPath = path.resolve(__dirname, "..", "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => {
    console.log(`✅ Servidor rodando em http://localhost:${port}`);
  });
}

startServer().catch(console.error);
