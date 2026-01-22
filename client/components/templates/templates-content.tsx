"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTemplateDialog } from "./create-template-dialog";
import { TemplatesList } from "./templates-list";

export function TemplatesContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
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
