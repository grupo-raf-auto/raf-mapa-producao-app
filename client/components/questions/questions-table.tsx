import { api } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { QuestionActions } from './question-actions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export async function QuestionsTable() {
  const questions = await api.questions.getAll();

  return (
    <Card className="shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs uppercase text-muted-foreground">Título</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">Tipo</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground">Criado em</TableHead>
            <TableHead className="text-xs uppercase text-muted-foreground text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhuma questão encontrada
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => (
              <TableRow key={question._id} className="hover:bg-gray-50 active:bg-gray-100">
                <TableCell className="font-medium">{question.title}</TableCell>
                <TableCell>
                  {question.inputType && (
                    <Badge variant="outline">
                      {question.inputType === 'date' && '📅 Data'}
                      {question.inputType === 'select' && '📋 Select'}
                      {question.inputType === 'email' && '📧 Email'}
                      {question.inputType === 'tel' && '📞 Telefone'}
                      {question.inputType === 'number' && '🔢 Número'}
                      {question.inputType === 'text' && '📝 Texto'}
                  </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={question.status === 'active' ? 'default' : 'secondary'}>
                    {question.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(question.createdAt), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <QuestionActions questionId={question._id!} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
