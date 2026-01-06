import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { CreateFormDialog } from './create-form-dialog';

export async function FormsList() {
  const forms = await api.forms.getAll();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Formulários
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Crie e gerencie formulários dinâmicos
          </p>
        </div>
        <CreateFormDialog>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Formulário
        </Button>
        </CreateFormDialog>
      </div>

      {forms.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum formulário criado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form._id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <CardDescription>{form.description || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {form.questions.length} questão(ões)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Criado em {format(new Date(form.createdAt), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/forms/${form._id}`}>Editar</Link>
                    </Button>
                    <Button variant="outline" size="sm">Visualizar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
