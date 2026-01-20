'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Preencha email e senha');
      return;
    }
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      const result = await authClient.signUp.email({
        name: name.trim() || email.split('@')[0] || 'Utilizador',
        email: email.trim().toLowerCase(),
        password,
        callbackURL: '/',
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      } as Parameters<typeof authClient.signUp.email>[0]);

      const { error } = result;

      if (error) {
        const err = error as { status?: number; statusText?: string; message?: string; error?: string; code?: string };
        const raw = (err?.error ?? err?.message ?? '').toLowerCase();
        const isAlreadyExists =
          raw.includes('already exists') ||
          raw.includes('já existe') ||
          raw.includes('user_already_exists');
        if (isAlreadyExists) {
          toast.error(
            'Já existe uma conta com este email. Use Entrar ou Esqueci a minha senha para aceder.',
            { duration: 6000 }
          );
          return;
        }
        const msg =
          err?.error ??
          err?.message ??
          (err?.status === 500
            ? 'Erro no servidor. Tente novamente.'
            : 'Erro ao criar conta');
        toast.error(msg);
        return;
      }

      toast.success('Conta criada com sucesso!');
      window.location.href = '/';
    } catch (err) {
      console.error('[sign-up] catch:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao registar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Criar conta</h1>
        <p className="text-gray-500 mb-6">Preencha os dados abaixo. Senha mín. 8 caracteres.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.pt"
              required
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 8 caracteres"
                required
                minLength={8}
                maxLength={128}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              minLength={8}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? 'A criar conta...' : 'Criar conta'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta? <Link href="/sign-in" className="text-blue-600 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
