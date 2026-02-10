import { useState, useEffect } from "react";
import { apiClient as api } from "@/lib/api-client";
import { AdminConsultasWrapper } from "./admin-consultas-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Search, Shield } from "lucide-react";

interface User {
  _id?: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
}

export function AdminConsultasContent() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      // Admin vê todas as submissões (scope=all)
      const [submissionsData, templatesData, questionsData, usersData] = await Promise.all([
        api.submissions.getAll({ scope: "all" }).catch(() => []),
        api.templates.getAll().catch(() => []),
        api.questions.getAll().catch(() => []),
        api.users.getAll().catch(() => []),
      ]);
      setSubmissions(submissionsData || []);
      setTemplates(templatesData || []);
      setQuestions(questionsData || []);
      // Filter out admin users - they don't have forms attached to them
      const nonAdminUsers = (usersData || []).filter((user: User) => user.role !== 'admin');
      setUsers(nonAdminUsers);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Consultas"
          description="Todas as consultas do sistema. Filtre por data, utilizador e estado."
          icon={Search}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Shield className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="py-12 sm:py-16 px-4 text-center flex flex-col items-center gap-3">
            <Spinner variant="bars" className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">A carregar consultas...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Consultas"
          description="Todas as consultas do sistema. Filtre por data, utilizador e estado."
          icon={Search}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Shield className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="py-10 sm:py-12 px-4 text-center">
            <p className="text-destructive font-medium mb-2">Erro ao carregar consultas</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full overflow-hidden">
      <PageHeader
        title="Consultas"
        description="Todas as consultas do sistema. Filtre por data, utilizador e estado."
        icon={Search}
        iconGradient="from-red-600 via-red-500 to-red-700"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-red-500"
      />
      <AdminConsultasWrapper
        submissions={submissions}
        templates={templates}
        questions={questions}
        users={users}
        onSubmissionUpdate={loadData}
      />
    </div>
  );
}
