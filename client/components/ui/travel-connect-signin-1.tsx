"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";

const NetworkPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Connection lines */}
    <path
      d="M100 80 L200 120 L300 60"
      stroke="#C9A861"
      strokeWidth="1"
      strokeOpacity="0.3"
    />
    <path
      d="M200 120 L250 200 L320 180"
      stroke="#1E3A5F"
      strokeWidth="1"
      strokeOpacity="0.3"
    />
    <path
      d="M100 80 L80 180 L150 250"
      stroke="#C9A861"
      strokeWidth="1"
      strokeOpacity="0.2"
    />
    <path
      d="M250 200 L200 280 L280 320"
      stroke="#1E3A5F"
      strokeWidth="1"
      strokeOpacity="0.3"
    />
    <path
      d="M150 250 L200 280"
      stroke="#C9A861"
      strokeWidth="1"
      strokeOpacity="0.3"
    />

    {/* Large nodes */}
    <circle cx="200" cy="120" r="8" fill="#1E3A5F" fillOpacity="0.8" />
    <circle cx="250" cy="200" r="6" fill="#C9A861" fillOpacity="0.8" />
    <circle cx="200" cy="280" r="6" fill="#1E3A5F" fillOpacity="0.6" />

    {/* Medium nodes */}
    <circle cx="100" cy="80" r="5" fill="#C9A861" fillOpacity="0.6" />
    <circle cx="300" cy="60" r="4" fill="#1E3A5F" fillOpacity="0.4" />
    <circle cx="320" cy="180" r="4" fill="#C9A861" fillOpacity="0.5" />
    <circle cx="80" cy="180" r="4" fill="#1E3A5F" fillOpacity="0.3" />
    <circle cx="150" cy="250" r="5" fill="#C9A861" fillOpacity="0.6" />
    <circle cx="280" cy="320" r="4" fill="#1E3A5F" fillOpacity="0.4" />

    {/* Small decorative dots */}
    <circle cx="140" cy="100" r="2" fill="#C9A861" fillOpacity="0.3" />
    <circle cx="260" cy="90" r="2" fill="#1E3A5F" fillOpacity="0.3" />
    <circle cx="180" cy="180" r="2" fill="#C9A861" fillOpacity="0.3" />
    <circle cx="290" cy="240" r="2" fill="#1E3A5F" fillOpacity="0.3" />
    <circle cx="120" cy="200" r="2" fill="#C9A861" fillOpacity="0.3" />
    <circle cx="230" cy="320" r="2" fill="#1E3A5F" fillOpacity="0.3" />
  </svg>
);

const SignInCard = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/",
      });
      if (error) {
        const m = (error.message || "").toLowerCase();
        const isInvalidCreds =
          m.includes("invalid email") ||
          m.includes("invalid password") ||
          m.includes("email or password") ||
          m.includes("credenciais");
        if (isInvalidCreds) {
          toast.error(
            "Email ou senha incorretos. Use Esqueci a minha senha se não se lembra.",
          );
        } else {
          toast.error(error.message || "Erro ao entrar");
        }
        return;
      }
      toast.success("Login realizado com sucesso!");
      window.location.href = "/";
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      toast.error("Erro ao fazer login com Google");
    }
  };

  return (
    <div className="flex w-full h-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-card shadow-xl border border-border/40"
      >
        {/* Left side - Branding */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-r border-border/40">
          <div className="absolute inset-0">
            <NetworkPattern />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-8">
            <div className="relative mb-8">
              <Image
                src="/logo-mycredit.png"
                alt="MYCREDIT - Intermediários de Crédito"
                width={200}
                height={80}
                className="h-auto w-auto max-w-[200px] object-contain"
                priority
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4 max-w-xs leading-relaxed">
              Inicia sessão para aceder ao{" "}
              <span className="text-primary font-medium">MySabi</span>
              <span className="text-secondary font-medium">chão</span>, o teu
              assistente de IA interno e base de conhecimento da empresa
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-card">
          <h1 className="font-title text-2xl md:text-3xl font-bold mb-1 text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="text-muted-foreground mb-2">
            Inicie sessão na sua conta
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Apenas e-mails @gruporaf.pt são permitidos
          </p>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 border border-border rounded-lg p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Iniciar Sessão
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Registar-se
            </button>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm font-medium text-foreground">
              Continuar com Google
            </span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">ou</span>
            </div>
          </div>

          {activeTab === "login" ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  E-mail <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.nome@gruporaf.pt"
                  required
                  disabled={loading}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Palavra-passe <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setPasswordVisible((v) => !v)}
                  >
                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "A entrar..." : "Iniciar sessão"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="text-center pt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueceu-se da palavra-passe?
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Para criar uma conta, contacte o administrador do sistema.
              </p>
              <Link
                href="/sign-up"
                className="text-primary hover:underline font-medium"
              >
                Ir para página de registo
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function TravelConnectSignIn() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <SignInCard />
    </div>
  );
}
