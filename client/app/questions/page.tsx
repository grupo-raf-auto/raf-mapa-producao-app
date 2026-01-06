import { MainLayout } from '@/components/layout/main-layout';
import { QuestionsList } from '@/components/questions/questions-list';

export default function QuestionsPage() {
  return (
    <MainLayout>
      <QuestionsList />
    </MainLayout>
  );
}
