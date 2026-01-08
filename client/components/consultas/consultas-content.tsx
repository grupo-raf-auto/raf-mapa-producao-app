import { ConsultasWrapper } from './consultas-wrapper';
import { api } from '@/lib/api';

export async function ConsultasContent() {
  // Buscar todos os dados: templates e questões
  const [templates, questions] = await Promise.all([
    api.templates.getAll(),
    api.questions.getAll(),
  ]);

  // Enriquecer templates com questões completas
  const templatesWithQuestions = templates.map((template: any) => ({
    ...template,
    questionsData: template.questions
      .map((questionId: string) => questions.find((q: any) => q._id === questionId))
      .filter(Boolean),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Consultas
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Visualize e filtre questões por template e outros critérios
        </p>
      </div>

      <ConsultasWrapper
        templates={templatesWithQuestions}
        allQuestions={questions}
      />
    </div>
  );
}
