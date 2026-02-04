'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ApprovalData {
  emailVerified: boolean;
  approvalStatus: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export default function ApprovalStatusPage() {
  const [data, setData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async (retryCount = 0): Promise<void> => {
    try {
      const res = await fetch('/api/user/approval-status', {
        credentials: 'include',
      });
      if (res.status === 401) {
        if (retryCount < 2) {
          await new Promise((r) => setTimeout(r, 600));
          return fetchStatus(retryCount + 1);
        }
        const callbackUrl = encodeURIComponent('/approval-status');
        window.location.href = `/sign-in?callbackUrl=${callbackUrl}`;
        return;
      }
      if (!res.ok) {
        throw new Error('Erro ao obter estado');
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (
      data?.approvalStatus !== 'pending' &&
      data?.approvalStatus !== 'PENDING'
    )
      return;
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [data?.approvalStatus]);

  useEffect(() => {
    const status = (data?.approvalStatus ?? '').toLowerCase();
    if (status === 'approved') {
      const t = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [data?.approvalStatus]);

  const status = (data?.approvalStatus ?? '').toLowerCase();

  const formatDate = (dateStr: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleString('pt-PT', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Loading */}
        {loading && (
          <Card className="border-0 shadow-lg shadow-black/5 bg-card">
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
              <div className="rounded-full bg-muted p-4">
                <Spinner
                  variant="bars"
                  className="w-8 h-8 text-muted-foreground"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  A verificar o estado da sua conta
                </p>
                <p className="text-xs text-muted-foreground">
                  Aguarde um momento...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="border-0 shadow-lg shadow-black/5 bg-card">
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mb-5">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Não foi possível verificar o estado
              </CardTitle>
              <CardDescription className="text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                Ocorreu um problema ao obter o estado da sua conta. Verifique a
                sua ligação à internet e tente novamente, ou inicie sessão para
                ser redirecionado.
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-3 font-medium">
                Detalhe: {error}
              </p>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 pt-2 pb-10">
              <Button asChild variant="default" size="lg" className="w-full">
                <Link href="/sign-in">Voltar ao início de sessão</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Email não verificado */}
        {!loading && !error && data && !data.emailVerified && (
          <Card className="border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
            <CardHeader className="text-center pb-2 pt-10">
              <div className="mx-auto rounded-full bg-primary/10 border border-primary/10 w-16 h-16 flex items-center justify-center mb-5">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                Passo 1 de 2
              </p>
              <CardTitle className="text-xl font-semibold tracking-tight">
                Verificação de email pendente
              </CardTitle>
              <CardDescription className="text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                Para continuar, confirme primeiro o seu endereço de email.
                Enviámos um link de verificação para a sua caixa de entrada.
                Depois de clicar no link, poderá aguardar a aprovação da conta
                por um administrador.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3 pt-2 pb-10">
              <Button asChild variant="default" size="lg" className="w-full">
                <Link
                  href="/verify-email"
                  className="inline-flex items-center gap-2"
                >
                  Ir para verificação de email
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Link href="/sign-in">Voltar ao início de sessão</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Pendente */}
        {!loading &&
          !error &&
          data &&
          data.emailVerified &&
          status === 'pending' && (
            <Card className="border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 w-16 h-16 flex items-center justify-center mb-5">
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Passo 2 de 2
                </p>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Aguardando aprovação da conta
                </CardTitle>
                <CardDescription className="text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  O seu email já foi verificado. A sua conta está agora em
                  análise por um administrador. Assim que for aprovada, terá
                  acesso à plataforma.
                </CardDescription>
                <div className="mt-6 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left">
                  <p className="text-xs font-medium text-foreground mb-1">
                    O que acontece a seguir?
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Um administrador analisa o seu pedido de acesso</li>
                    <li>
                      Será redirecionado automaticamente quando for aprovado
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Esta página atualiza automaticamente a cada poucos segundos.
                </p>
              </CardHeader>
              <CardContent className="pt-0 pb-10 flex justify-center">
                <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Em análise
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Aprovado */}
        {!loading &&
          !error &&
          data &&
          data.emailVerified &&
          status === 'approved' && (
            <Card className="border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 w-16 h-16 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Conta aprovada
                </CardTitle>
                <CardDescription className="text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  O seu pedido de acesso foi aprovado. Está a ser redirecionado
                  para a plataforma. Se não for redirecionado em breve, utilize
                  o botão abaixo.
                </CardDescription>
                {formatDate(data.approvedAt) && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Aprovado em {formatDate(data.approvedAt)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0 pb-10 flex flex-col items-center gap-4">
                <Spinner
                  variant="bars"
                  className="w-6 h-6 text-muted-foreground"
                />
                <Button asChild variant="outline" size="sm">
                  <Link href="/">Entrar na plataforma</Link>
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Rejeitado */}
        {!loading &&
          !error &&
          data &&
          data.emailVerified &&
          status === 'rejected' && (
            <Card className="border-0 shadow-lg shadow-black/5 bg-card overflow-hidden">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto rounded-full bg-destructive/10 border border-destructive/20 w-16 h-16 flex items-center justify-center mb-5">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Acesso não aprovado
                </CardTitle>
                <CardDescription className="text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  O pedido de acesso à sua conta não foi aprovado. Se considerar
                  que isto é um engano ou precisar de mais informações, contacte
                  o administrador da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-4 space-y-4">
                {data.rejectionReason && (
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs font-medium text-foreground mb-1.5">
                      Motivo indicado
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {data.rejectionReason}
                    </p>
                  </div>
                )}
                {formatDate(data.rejectedAt) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Rejeitado em {formatDate(data.rejectedAt)}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-2 pb-10">
                <Button asChild variant="default" size="lg" className="w-full">
                  <Link href="/sign-in">Voltar ao início de sessão</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

        {/* Sem dados */}
        {!loading && !error && !data && (
          <Card className="border-0 shadow-lg shadow-black/5 bg-card">
            <CardContent className="pt-10 pb-10 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível obter o estado da conta. Inicie sessão para
                continuar.
              </p>
              <Button asChild variant="default" size="sm" className="mt-5">
                <Link href="/sign-in">Iniciar sessão</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
