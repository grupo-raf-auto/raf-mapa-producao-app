'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bug, Loader2, Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface ReportBugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportBugDialog({ open, onOpenChange }: ReportBugDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (t.length < 3) {
      toast.error('Título com pelo menos 3 caracteres.');
      return;
    }
    if (d.length < 10) {
      toast.error('Descrição com pelo menos 10 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.tickets.create({ title: t, description: d });
      toast.success('Reporte enviado. A equipa analisará em breve.');
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-0 gap-0 rounded-xl overflow-hidden border shadow-lg"
        showCloseButton={true}
        onPointerDownOutside={() => !submitting && onOpenChange(false)}
      >
        {/* Header compacto */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-0 border-b">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Bug className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Reportar problema
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                A equipa recebe o reporte e responde pelo painel de suporte.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-title" className="text-sm font-medium">
              Assunto
            </Label>
            <Input
              id="bug-title"
              placeholder="Ex.: Erro ao guardar no formulário X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="h-10 rounded-lg bg-muted/30 focus-visible:ring-2 border-border/60"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {title.length}/200
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-description" className="text-sm font-medium">
              Descrição
            </Label>
            <textarea
              id="bug-description"
              placeholder="O que aconteceu? Em que página ou ação? O que esperava?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={4}
              className="flex w-full rounded-lg bg-muted/30 border border-border/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:opacity-50 resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {description.length}/5000
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 pb-6 px-0 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />A enviar...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar reporte
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
