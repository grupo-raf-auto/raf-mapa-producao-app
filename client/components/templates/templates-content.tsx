"use client";

import { Button } from "@/components/ui/button";
import { Plus, FileText, Layers } from "lucide-react";
import { CreateTemplateDialog } from "./create-template-dialog";
import { TemplatesList } from "./templates-list";
import { PageHeader } from "@/components/ui/page-header";

export function TemplatesContent() {
  return (
    <div className="space-y-6">
      <div className="relative">
        <PageHeader
          title="Templates"
          description="Crie e gerencie templates de formulários. Configure modelos reutilizáveis para agilizar o processo de submissão."
          icon={FileText}
          iconGradient="from-red-600 via-red-500 to-red-700"
          decoratorIcon={<Layers className="w-5 h-5" />}
          decoratorColor="text-red-500"
        />
        <div className="absolute top-0 right-0">
          <CreateTemplateDialog>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </CreateTemplateDialog>
        </div>
      </div>

      <TemplatesList />
    </div>
  );
}
