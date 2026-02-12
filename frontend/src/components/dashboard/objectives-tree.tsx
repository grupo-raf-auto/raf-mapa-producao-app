import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

interface ObjectiveNode {
  id: string;
  title: string;
  description?: string | null;
  parentId?: string | null;
  teamId?: string | null;
  order: number;
  children: ObjectiveNode[];
}

interface ObjectivesTreeProps {
  teamId?: string | null;
}

export function ObjectivesTree({ teamId }: ObjectivesTreeProps) {
  const { isAdmin } = useAuth();
  const [tree, setTree] = useState<ObjectiveNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadTree = async () => {
    try {
      setLoading(true);
      const data = await apiClient.objectives.getTree(teamId ?? undefined);
      setTree(Array.isArray(data) ? data : []);
    } catch {
      setTree([]);
      toast.error('Erro ao carregar objetivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [teamId]);

  const openCreate = (parent?: string | null) => {
    setEditingId(null);
    setParentId(parent ?? null);
    setFormTitle('');
    setFormDescription('');
    setDialogOpen(true);
  };

  const openEdit = (node: ObjectiveNode) => {
    setEditingId(node.id);
    setParentId(null);
    setFormTitle(node.title);
    setFormDescription(node.description ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title) {
      toast.error('Título é obrigatório');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.objectives.update(editingId, {
          title,
          description: formDescription.trim() || undefined,
        });
        toast.success('Objetivo atualizado');
      } else {
        await apiClient.objectives.create({
          title,
          description: formDescription.trim() || undefined,
          parentId: parentId ?? undefined,
          teamId: teamId ?? undefined,
        });
        toast.success('Objetivo criado');
      }
      setDialogOpen(false);
      loadTree();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteSubmitting(true);
    try {
      await apiClient.objectives.delete(deleteId);
      toast.success('Objetivo removido');
      setDeleteId(null);
      loadTree();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const renderNode = (node: ObjectiveNode, depth: number) => (
    <div key={node.id} className="space-y-1" style={{ marginLeft: depth * 24 }}>
      <div className="group flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/40 border border-border/60 min-w-0">
        {isAdmin && (
          <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground/50 cursor-grab" />
        )}
        <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{node.title}</p>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{node.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openCreate(node.id)}
              title="Adicionar sub-objetivo"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEdit(node)}
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteId(node.id)}
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      {node.children?.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Objetivos
        </h3>
        {isAdmin && (
          <Button size="sm" onClick={() => openCreate()} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Novo objetivo
          </Button>
        )}
      </div>
      {tree.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isAdmin ? (
              <p>Nenhum objetivo definido. Clique em &quot;Novo objetivo&quot; para criar.</p>
            ) : (
              <p>Ainda não há objetivos definidos.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              {tree.map((node) => renderNode(node, 0))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar objetivo' : 'Novo objetivo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Aumentar vendas"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Breve descrição"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl">
              {saving ? <Spinner variant="bars" className="w-4 h-4" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover objetivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza? Os sub-objetivos também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting} className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSubmitting} className="rounded-xl">
              {deleteSubmitting ? <Spinner variant="bars" className="w-4 h-4" /> : 'Remover'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
