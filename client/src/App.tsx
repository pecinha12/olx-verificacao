import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Cadastro from "./pages/Cadastro";
import Home from "./pages/Home";

type Dados = {
  nome: string;
  cpf: string;
  nascimento: string;
  tipoChave: string;
  chavePix: string;
};

function App() {
  const [dados, setDados] = useState<Dados | null>(null);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {dados ? (
            <Home dados={dados} />
          ) : (
            <Cadastro onContinuar={setDados} />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
