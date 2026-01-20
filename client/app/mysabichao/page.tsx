import { MainLayout } from '@/components/layout/main-layout';
import RuixenMoonChat from '@/components/ui/mysabichao-chat';

export default function MySabichaoPage() {
  return (
    <MainLayout>
      <RuixenMoonChat />
    </MainLayout>
  );
}

export const dynamic = 'force-dynamic';
