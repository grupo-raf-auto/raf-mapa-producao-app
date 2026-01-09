import { QuestionsTable } from './questions-table';
import { QuestionFilters } from './question-filters';
import { CreateQuestionDialog } from './create-question-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export async function QuestionsList() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Questões
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gerencie todas as questões do sistema
          </p>
        </div>
        <CreateQuestionDialog>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Questão
          </Button>
        </CreateQuestionDialog>
      </div>

      <QuestionFilters />
      <QuestionsTable />
    </div>
  );
}
