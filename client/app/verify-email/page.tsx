'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { Mail, ArrowRight, CheckCircle2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const RESEND_COOLDOWN_SEC = 60;

export default function VerifyEmailPage() {
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const emailParam = params.get('email');
    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem('pendingEmail')
        : null;
    setEmail(emailParam || session?.user?.email || stored || '');
  }, [session?.user?.email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    const toSend = email || session?.user?.email;
    if (!toSend || resendLoading || cooldown > 0) return;
    setResendLoading(true);
    setResendSent(false);
    try {
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: toSend.trim().toLowerCase(),
          callbackURL: '/approval-status',
        }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendSent(true);
        setCooldown(RESEND_COOLDOWN_SEC);
        toast.success('Email reenviado. Verifique a sua caixa de entrada.');
      } else {
        toast.error('Não foi possível reenviar. Tente novamente.');
        console.error(data);
      }
    } catch (e) {
      toast.error('Erro de ligação. Tente novamente.');
      console.error(e);
    } finally {
      setResendLoading(false);
    }
  }, [email, session?.user?.email, resendLoading, cooldown]);

  const handleCopyEmail = useCallback(() => {
    if (!email) return;
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      toast.success('Email copiado');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [email]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <Card className="w-full max-w-[420px] border-0 shadow-lg shadow-black/5 bg-card">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
            <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">A carregar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <Card className="w-full max-w-[420px] border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className="rounded-full bg-primary/5 border border-primary/10 w-16 h-16 flex items-center justify-center mb-6"
            aria-hidden
          >
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Verifique o seu email
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-[320px] leading-relaxed">
            Enviámos um link de verificação para o endereço abaixo. Clique no
            link para continuar.
          </p>

          {/* Email chip with copy */}
          <div className="mt-6 w-full flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate text-left">
              {email || '—'}
            </p>
            {email && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleCopyEmail}
                aria-label="Copiar email"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Verifique também a pasta de spam. O link expira em 24 horas.
          </p>

          <div className="mt-8 w-full space-y-4">
            <Button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || !email || cooldown > 0}
              variant="default"
              size="lg"
              className="w-full h-11 font-medium"
            >
              {resendLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner variant="bars" className="w-4 h-4" />A reenviar...
                </span>
              ) : resendSent && cooldown > 0 ? (
                `Reenviar novamente em ${cooldown}s`
              ) : resendSent ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Email reenviado
                </span>
              ) : (
                'Reenviar email'
              )}
            </Button>

            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar ao início de sessão
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <p className="mt-8 pt-6 border-t border-border text-[11px] text-muted-foreground w-full max-w-[320px]">
              Em desenvolvimento: se o Resend estiver em modo teste, o link pode
              aparecer no terminal do servidor.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
