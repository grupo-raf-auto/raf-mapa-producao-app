import { Eye } from 'lucide-react';
import { Link } from '@/lib/router-compat';

interface Submission {
  id: string;
  templateId: string;
  template?: { name: string };
  answers: {
    questionId: string;
    question?: { text: string };
    answer: string;
  }[];
  createdAt: string;
  user?: { name: string; email: string };
}

interface EmployeeTaskTableProps {
  submissions?: Submission[];
}

// Helper para extrair valor de uma resposta
function getAnswerValue(
  answers: Submission['answers'],
  questionText: string,
): string {
  const answer = answers.find((a) =>
    a.question?.text?.toLowerCase().includes(questionText.toLowerCase()),
  );
  return answer?.answer || '-';
}

// Helper para formatar valor monetário
function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Helper para formatar data
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function EmployeeTaskTable({
  submissions = [],
}: EmployeeTaskTableProps) {
  const hasSubmissions = submissions.length > 0;

  return (
    <div className="data-table-container">
      {/* Header */}
      <div className="data-table-header">
        <h3 className="data-table-title">Últimas Submissões</h3>

        <div className="flex items-center gap-3">
          <Link to="/consultas" className="btn btn-primary text-sm">
            Ver Todas
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Formulário</th>
              <th>Banco</th>
              <th>Seguradora</th>
              <th>Valor</th>
              <th>Data</th>
              <th className="text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {hasSubmissions ? (
              submissions.map((submission) => {
                const banco = getAnswerValue(submission.answers, 'banco');
                const seguradora = getAnswerValue(
                  submission.answers,
                  'seguradora',
                );
                const valor = getAnswerValue(submission.answers, 'valor');

                return (
                  <tr key={submission.id}>
                    <td className="font-medium">
                      {submission.template?.name || 'Formulário'}
                    </td>
                    <td className="text-muted-foreground">{banco}</td>
                    <td className="text-muted-foreground">{seguradora}</td>
                    <td className="font-medium text-primary">
                      {valor !== '-' ? formatCurrency(valor) : '-'}
                    </td>
                    <td className="text-muted-foreground">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/consultas?id=${submission.id}`}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Ainda não existem submissões.
                  <br />
                  <Link
                    to="/formularios"
                    className="text-primary hover:underline"
                  >
                    Preencher formulário
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
