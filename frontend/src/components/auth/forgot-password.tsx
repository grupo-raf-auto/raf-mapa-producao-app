import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { forgetPassword } from "@/lib/auth-client";
import { ArrowRight } from "lucide-react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Indique o seu email");
      return;
    }
    setLoading(true);
    setSent(false);
    try {
      const { error } = await forgetPassword({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Se o email existir, receberá as instruções em breve.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao solicitar recuperação de senha",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Recuperar senha
        </h1>
        <p className="text-gray-500 mb-6">
          {sent
            ? "Se existir uma conta com esse email, enviámos as instruções para redefinir a senha."
            : "Indique o email da sua conta. Enviaremos um link para redefinir a senha."}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.pt"
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50"
            >
              {loading ? "A enviar..." : "Enviar link de recuperação"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-600">
            O link expira em 1 hora. Não recebeu? Verifique o spam ou{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-red-600 hover:underline"
            >
              tente novamente
            </button>
            .
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/sign-in" className="text-red-600 hover:underline">
            Voltar ao início de sessão
          </Link>
        </p>
      </div>
    </div>
  );
}
