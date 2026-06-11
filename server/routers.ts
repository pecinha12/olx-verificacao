import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

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

        const body = {
          amount: input.amount,
          description: input.description,
          payerName: input.payerName,
          payerDocument: input.payerDocument,
        };

        console.log("[ElitePAYbr] Iniciando depósito:", { ...body, apiUrl });

        const response = await fetch(`${apiUrl}/api/v1/deposit`, {
          method: "POST",
          headers: {
            "x-client-id": clientId,
            "x-client-secret": clientSecret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const rawText = await response.text();
        console.log("[ElitePAYbr] Status:", response.status);
        console.log("[ElitePAYbr] Resposta bruta:", rawText);

        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(`Elite PAYbr retornou resposta inválida: ${rawText}`);
        }

        if (!response.ok) {
          throw new Error(`Elite PAYbr error (${response.status}): ${JSON.stringify(data)}`);
        }

        // Normalizar campos — a API pode retornar nomes diferentes
        const qrcodeUrl = data.qrcodeUrl ?? data.qrcode_url ?? data.qrCode ?? data.qr_code ?? null;
        const copyPaste = data.copyPaste ?? data.copy_paste ?? data.pixCopiaECola ?? data.pix_code ?? null;
        const transactionId = data.transactionId ?? data.transaction_id ?? data.id ?? null;

        console.log("[ElitePAYbr] QR Code URL:", qrcodeUrl ? "✅ recebido" : "❌ ausente");
        console.log("[ElitePAYbr] Copy/Paste:", copyPaste ? "✅ recebido" : "❌ ausente");
        console.log("[ElitePAYbr] Transaction ID:", transactionId);

        return {
          success: data.success ?? true,
          transactionId,
          qrcodeUrl,
          copyPaste,
          status: data.status ?? "PENDENTE",
        };
      }),

    checkStatus: publicProcedure
      .input(z.object({
        transactionId: z.string(),
      }))
      .query(async ({ input }) => {
        const clientId = process.env.ELITE_PAYBR_CLIENT_ID;
        const clientSecret = process.env.ELITE_PAYBR_CLIENT_SECRET;
        const apiUrl = process.env.ELITE_PAYBR_API_URL || "https://api.elitepaybr.com";

        if (!clientId || !clientSecret) {
          throw new Error("Elite PAYbr credentials not configured");
        }

        const response = await fetch(`${apiUrl}/api/transactions/check`, {
          method: "POST",
          headers: {
            "x-client-id": clientId,
            "x-client-secret": clientSecret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transactionId: input.transactionId }),
        });

        const data = await response.json();
        console.log("[ElitePAYbr] Status consulta:", data);

        return data;
      }),
  }),
});

export type AppRouter = typeof appRouter;
