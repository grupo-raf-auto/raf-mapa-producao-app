"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTemplateDialog } from "@/components/templates/create-template-dialog";
import { TemplatesList } from "@/components/templates/templates-list";

export function TemplatesManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gerenciar Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie templates de formulários
          </p>
        </div>
        <CreateTemplateDialog>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        </CreateTemplateDialog>
      </div>

      <TemplatesList />
    </div>
  );
}
