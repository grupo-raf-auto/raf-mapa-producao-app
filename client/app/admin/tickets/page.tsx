'use client';

import { AdminTicketsContent } from '@/components/admin/admin-tickets-content';
import { PageHeader } from '@/components/ui/page-header';
import { Shield, Ticket } from 'lucide-react';

export default function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Sistema de suporte e tickets. Acompanhe pedidos de ajuda dos utilizadores."
        icon={Ticket}
        iconGradient="from-slate-700 via-slate-600 to-slate-800"
        decoratorIcon={<Shield className="w-5 h-5" />}
        decoratorColor="text-slate-500"
      />
      <AdminTicketsContent />
    </div>
  );
}
