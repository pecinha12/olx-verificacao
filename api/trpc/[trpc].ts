import { initTRPC } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import type { Request, Response } from "express";

const t = initTRPC.create({});
const router = t.router;
const publicProcedure = t.procedure;

const appRouter = router({
  payment: router({
    createDeposit: publicProcedure
      .input(z.object({
        amount: z.number().positive(),
        description: z.string(),
        payerName: z.string(),
        payerDocument: z.string(),
      }))
      .mutation(async ({ input }) => {
        const clientId = process.env.ELITE_PAYBR_CLIENT_ID;
        const clientSecret = process.env.ELITE_PAYBR_CLIENT_SECRET;
        const apiUrl = process.env.ELITE_PAYBR_API_URL || "https://api.elitepaybr.com";

        if (!clientId || !clientSecret) {
          throw new Error("Elite PAYbr credentials not configured");
        }

        const response = await fetch(`${apiUrl}/api/v1/deposit`, {
          method: "POST",
          headers: {
            "x-client-id": clientId,
            "x-client-secret": clientSecret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        const rawText = await response.text();
        console.log("[ElitePAYbr] Status:", response.status);
        console.log("[ElitePAYbr] Resposta:", rawText);

        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(`Resposta inválida da gateway: ${rawText}`);
        }

        if (!response.ok) {
          throw new Error(`Elite PAYbr error (${response.status}): ${JSON.stringify(data)}`);
        }

        const qrcodeUrl = data.qrcodeUrl ?? data.qrcode_url ?? data.qrCode ?? data.qr_code ?? null;
        const copyPaste = data.copyPaste ?? data.copy_paste ?? data.pixCopiaECola ?? data.pix_code ?? null;
        const transactionId = data.transactionId ?? data.transaction_id ?? data.id ?? null;

        // Corrigir base64
        let qrFinal = qrcodeUrl;
        if (qrFinal && !qrFinal.startsWith("http") && !qrFinal.startsWith("data:")) {
          qrFinal = `data:image/png;base64,${qrFinal.replace(/^base64:/, "")}`;
        }

        return {
          success: true,
          transactionId,
          qrcodeUrl: qrFinal,
          copyPaste,
          status: data.status ?? "PENDENTE",
        };
      }),

    checkStatus: publicProcedure
      .input(z.object({ transactionId: z.string() }))
      .query(async ({ input }) => {
        const clientId = process.env.ELITE_PAYBR_CLIENT_ID;
        const clientSecret = process.env.ELITE_PAYBR_CLIENT_SECRET;
        const apiUrl = process.env.ELITE_PAYBR_API_URL || "https://api.elitepaybr.com";

        const response = await fetch(`${apiUrl}/api/transactions/check`, {
          method: "POST",
          headers: {
            "x-client-id": clientId!,
            "x-client-secret": clientSecret!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transactionId: input.transactionId }),
        });

        return response.json();
      }),
  }),

  auth: router({
    me: publicProcedure.query(() => null),
    logout: publicProcedure.mutation(() => ({ success: true })),
  }),

  system: router({
    health: publicProcedure.query(() => ({ ok: true })),
  }),
});

export type AppRouter = typeof appRouter;

const handler = createExpressMiddleware({
  router: appRouter,
  createContext: ({ req, res }: { req: Request; res: Response }) => ({ req, res, user: null }),
});

export default function (req: any, res: any) {
  return handler(req, res, () => {});
}
