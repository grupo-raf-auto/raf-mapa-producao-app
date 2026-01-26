'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import Image from 'next/image';

type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Set up routes that will animate across the map - using Grupo RAF colors
  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    {
      start: { x: 100, y: 150, delay: 0 },
      end: { x: 200, y: 80, delay: 2 },
      color: '#E14840', // Primary red
    },
    {
      start: { x: 200, y: 80, delay: 2 },
      end: { x: 260, y: 120, delay: 4 },
      color: '#E14840',
    },
    {
      start: { x: 50, y: 50, delay: 1 },
      end: { x: 150, y: 180, delay: 3 },
      color: '#14b8a6', // Accent teal
    },
    {
      start: { x: 280, y: 60, delay: 0.5 },
      end: { x: 180, y: 180, delay: 2.5 },
      color: '#E14840',
    },
  ];

  // Create dots for the network pattern
  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 15;
    const dotRadius = 1.5;

    // Create a network pattern with strategic placement
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Create a more organic network pattern
        const isInPattern =
          // Central cluster
          ((x < width * 0.6 && x > width * 0.2) && (y < height * 0.7 && y > height * 0.2)) ||
          // Top right
          ((x < width * 0.9 && x > width * 0.65) && (y < height * 0.4 && y > height * 0.1)) ||
          // Bottom left
          ((x < width * 0.35 && x > width * 0.1) && (y < height * 0.9 && y > height * 0.6));

        if (isInPattern && Math.random() > 0.4) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.4 + 0.2,
          });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    // Draw background dots
    function drawDots() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw the dots
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 72, 64, ${dot.opacity})`; // Primary red with opacity
        ctx.fill();
      });
    }

    // Draw animated routes
    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000; // Time in seconds

      routes.forEach((route) => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;

        const duration = 3; // Animation duration in seconds
        const progress = Math.min(elapsed / duration, 1);

        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        // Draw the route line
        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the start point
        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();

        // Draw the moving point
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();

        // Add glow effect to the moving point
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = `${route.color}40`; // 40 = 25% opacity in hex
        ctx.fill();

        // If the route is complete, draw the end point
        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }

    // Animation loop
    function animate() {
      drawDots();
      drawRoutes();

      // If all routes are complete, restart the animation
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) {
        // Reset after 15 seconds
        startTime = Date.now();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

const SignInCard = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isHovered, setIsHovered] = useState(false);
  
  // Registration states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordVisible, setRegisterPasswordVisible] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: '/',
      });
      if (error) {
        const m = (error.message || '').toLowerCase();
        const isInvalidCreds =
          m.includes('invalid email') ||
          m.includes('invalid password') ||
          m.includes('email or password') ||
          m.includes('credenciais');
        if (isInvalidCreds) {
          toast.error(
            'Email ou senha incorretos. Use Esqueci a minha senha se não se lembra.',
          );
        } else {
          toast.error(error.message || 'Erro ao entrar');
        }
        return;
      }
      toast.success('Login realizado com sucesso!');
      window.location.href = '/';
    } catch {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (activeTab === 'register') {
        await authClient.signUp.social({
          provider: 'google',
          callbackURL: '/',
        });
      } else {
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: '/',
        });
      }
    } catch {
      toast.error(
        activeTab === 'register'
          ? 'Erro ao registar com Google'
          : 'Erro ao fazer login com Google',
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName.trim()) {
      toast.error('O primeiro nome é obrigatório');
      return;
    }
    if (!lastName.trim()) {
      toast.error('O último nome é obrigatório');
      return;
    }
    if (!registerEmail.trim()) {
      toast.error('O e-mail é obrigatório');
      return;
    }
    if (registerPassword.length < 8) {
      toast.error('A palavra-passe deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
        callbackURL: '/',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      const { error } = result;

      if (error) {
        const err = error as {
          status?: number;
          statusText?: string;
          message?: string;
          error?: string;
          code?: string;
        };
        const raw = (err?.error ?? err?.message ?? '').toLowerCase();
        const isAlreadyExists =
          raw.includes('already exists') ||
          raw.includes('já existe') ||
          raw.includes('user_already_exists');
        if (isAlreadyExists) {
          toast.error(
            'Já existe uma conta com este email. Use Iniciar Sessão para aceder.',
            { duration: 6000 },
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
      console.error('[register] catch:', err);
      toast.error(
        err instanceof Error ? err.message : 'Erro ao registar',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-card shadow-xl border border-border/40"
      >
        {/* Left side - Branding with animated map */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-r border-border/40 h-[600px]">
          <div className="absolute inset-0">
            <DotMap />
          </div>

          {/* Logo and text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative mb-6"
            >
              <Image
                src="/logo-raf.png"
                alt="Grupo RAF - Intermediários de Crédito"
                width={200}
                height={80}
                className="h-auto w-auto max-w-[200px] object-contain"
                priority
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center text-sm text-foreground/80 mt-4 max-w-xs leading-relaxed"
            >
              Acede à plataforma do{' '}
              <span className="text-primary font-semibold">Grupo RAF</span> e ao{' '}
              <span className="text-primary font-semibold">MySabichão</span>, o
              teu assistente inteligente para gestão de crédito, formulários e
              conhecimento interno
            </motion.p>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-card">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-foreground">
              {activeTab === 'register' ? 'Criar conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="text-muted-foreground mb-2">
              {activeTab === 'register'
                ? 'Registe-se para começar'
                : 'Inicie sessão na sua conta'}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Apenas e-mails @gruporaf.pt são permitidos
            </p>

            {/* Tabs */}
            <div className="flex gap-0 mb-6 border border-border rounded-lg p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  activeTab === 'login'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Iniciar Sessão
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  activeTab === 'register'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Registar-se
              </button>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors mb-6"
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
                {activeTab === 'register'
                  ? 'Continuar com Google'
                  : 'Continuar com Google'}
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

            <AnimatePresence mode="wait">
              {activeTab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                  onSubmit={handleSubmit}
                >
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
                        type={passwordVisible ? 'text' : 'password'}
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
                        {passwordVisible ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className="pt-2"
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:bg-primary/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
                        isHovered ? 'shadow-lg shadow-primary/20' : '',
                      )}
                    >
                      <span className="flex items-center justify-center">
                        {loading ? 'A entrar...' : 'Iniciar sessão'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                      {isHovered && !loading && (
                        <motion.span
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1, ease: 'easeInOut' }}
                          className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          style={{ filter: 'blur(8px)' }}
                        />
                      )}
                    </button>
                  </motion.div>
                  <div className="text-center pt-2">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueceu-se da palavra-passe?
                    </Link>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                  onSubmit={handleRegisterSubmit}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        Primeiro Nome <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Primeiro nome"
                        required
                        disabled={loading}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        Último Nome <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Último nome"
                        required
                        disabled={loading}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="registerEmail"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      E-mail <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="registerEmail"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      required
                      disabled={loading}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="registerPassword"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      Palavra-passe <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="registerPassword"
                        type={registerPasswordVisible ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Introduza a sua palavra-passe"
                        required
                        minLength={8}
                        disabled={loading}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setRegisterPasswordVisible((v) => !v)}
                      >
                        {registerPasswordVisible ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo de 8 carateres
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className="pt-2"
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:bg-primary/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
                        isHovered ? 'shadow-lg shadow-primary/20' : '',
                      )}
                    >
                      <span className="flex items-center justify-center">
                        {loading ? 'A criar conta...' : 'Criar conta'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                      {isHovered && !loading && (
                        <motion.span
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1, ease: 'easeInOut' }}
                          className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          style={{ filter: 'blur(8px)' }}
                        />
                      )}
                    </button>
                  </motion.div>
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      Já tem conta?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="text-primary hover:underline font-medium"
                      >
                        Iniciar sessão
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
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
