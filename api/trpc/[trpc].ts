import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

const t = initTRPC.create();

const appRouter = t.router({
  payment: t.router({
    createDeposit: t.procedure
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
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Credenciais não configuradas" });
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
        console.log("[ElitePAYbr] Status:", response.status, "Body:", rawText);

        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Resposta inválida: ${rawText}` });
        }

        if (!response.ok) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gateway error ${response.status}: ${JSON.stringify(data)}` });
        }

        const qrcodeUrl = data.qrcodeUrl ?? data.qrcode_url ?? data.qrCode ?? data.qr_code ?? null;
        const copyPaste = data.copyPaste ?? data.copy_paste ?? data.pixCopiaECola ?? data.pix_code ?? null;
        const transactionId = data.transactionId ?? data.transaction_id ?? data.id ?? null;

        let qrFinal = qrcodeUrl;
        if (qrFinal && !qrFinal.startsWith("http") && !qrFinal.startsWith("data:")) {
          qrFinal = `data:image/png;base64,${qrFinal.replace(/^base64:/, "")}`;
        }

        return { success: true, transactionId, qrcodeUrl: qrFinal, copyPaste, status: data.status ?? "PENDENTE" };
      }),

    checkStatus: t.procedure
      .input(z.object({ transactionId: z.string() }))
      .query(async ({ input }) => {
        const clientId = process.env.ELITE_PAYBR_CLIENT_ID!;
        const clientSecret = process.env.ELITE_PAYBR_CLIENT_SECRET!;
        const apiUrl = process.env.ELITE_PAYBR_API_URL || "https://api.elitepaybr.com";

        const response = await fetch(`${apiUrl}/api/transactions/check`, {
          method: "POST",
          headers: { "x-client-id": clientId, "x-client-secret": clientSecret, "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: input.transactionId }),
        });
        return response.json();
      }),
  }),

  auth: t.router({
    me: t.procedure.query(() => null),
    logout: t.procedure.mutation(() => ({ success: true })),
  }),

  system: t.router({
    health: t.procedure.query(() => ({ ok: true })),
  }),
});

export type AppRouter = typeof appRouter;

export default async function handler(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}

export const config = { runtime: "edge" };
