import { useState, useEffect } from 'react';
import { apiClient as api } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Copy, Sparkles, Mail, MessageCircle } from 'lucide-react';

interface Context {
  id: string;
  name: string;
  description: string;
  channel: 'email' | 'whatsapp';
}

interface Template {
  id: string;
  contextId: string;
  name: string;
  description: string;
}

export function MessageGeneratorContent() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contextId, setContextId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ctxRes, tplRes] = await Promise.all([
          api.messageGenerator.getContexts(),
          api.messageGenerator.getTemplates(),
        ]);
        setContexts((ctxRes as Context[]) || []);
        setTemplates((tplRes as Template[]) || []);
      } catch (e) {
        toast.error('Erro ao carregar contextos e templates');
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const filteredTemplates = contextId
    ? templates.filter((t) => t.contextId === contextId)
    : [];

  const handleContextChange = (value: string) => {
    setContextId(value);
    setTemplateId('');
    setGeneratedText('');
  };

  const handleGenerate = async () => {
    if (!contextId) {
      toast.error('Selecione um contexto');
      return;
    }
    setLoading(true);
    setGeneratedText('');
    try {
      const res = await api.messageGenerator.generate({
        contextId,
        templateId: templateId || undefined,
        userInput: userInput.trim(),
      });
      const data = res as { text?: string };
      setGeneratedText(data.text ?? '');
      toast.success('Mensagem gerada');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar mensagem';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      toast.success('Copiado para a área de transferência');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const currentContext = contexts.find((c) => c.id === contextId);

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner variant="bars" className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Configuração
          </CardTitle>
          <CardDescription>
            Escolha o contexto e o tipo de mensagem. Descreva a situação ou dados
            do cliente para personalizar o texto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="space-y-2">
            <Label htmlFor="context">Contexto / Situação</Label>
            <Select value={contextId} onValueChange={handleContextChange}>
              <SelectTrigger id="context" className="w-full">
                <SelectValue placeholder="Selecione o contexto" />
              </SelectTrigger>
              <SelectContent>
                {contexts.map((ctx) => (
                  <SelectItem key={ctx.id} value={ctx.id}>
                    <span className="flex items-center gap-2">
                      {ctx.channel === 'email' ? (
                        <Mail className="size-4 text-muted-foreground" />
                      ) : (
                        <MessageCircle className="size-4 text-muted-foreground" />
                      )}
                      {ctx.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentContext && (
              <p className="text-xs text-muted-foreground">
                {currentContext.description}
              </p>
            )}
          </div>

          {contextId && filteredTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Template (estilo do texto)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Selecione um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="input">
              Situação ou dados do cliente (opcional)
            </Label>
            <Textarea
              id="input"
              placeholder="Ex.: Cliente João Silva, falta o comprovativo de morada e o último recibo de vencimento. Prazo até sexta-feira."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Spinner variant="circle" className="size-4" />
                A gerar...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Gerar mensagem
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm flex flex-col">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg">Resultado</CardTitle>
          <CardDescription>
            Use o texto abaixo em email ou WhatsApp. Pode editar antes de enviar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-5 min-h-[200px]">
          {generatedText ? (
            <>
              <div className="flex-1 rounded-lg border border-border/80 bg-muted/30 p-4 text-sm whitespace-pre-wrap font-sans">
                {generatedText}
              </div>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="mt-4 w-full gap-2"
              >
                <Copy className="size-4" />
                Copiar texto
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 text-muted-foreground text-sm">
              {loading
                ? 'A gerar a sua mensagem...'
                : 'Selecione um contexto e clique em "Gerar mensagem".'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
