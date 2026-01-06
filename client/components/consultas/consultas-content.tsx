import { ConsultasWrapper } from './consultas-wrapper';
import { api } from '@/lib/api';

export async function ConsultasContent() {
  // Buscar todos os dados
  const [questions, categories, forms] = await Promise.all([
    api.questions.getAll(),
    api.categories.getAll(),
    api.forms.getAll(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Consultas
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Visualize e filtre todos os dados do sistema
        </p>
      </div>

      <ConsultasWrapper
        questions={questions}
        categories={categories}
        forms={forms}
      />
    </div>
  );
}
