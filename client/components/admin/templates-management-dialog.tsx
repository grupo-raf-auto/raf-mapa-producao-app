"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTemplateDialog } from "@/components/templates/create-template-dialog";
import { TemplatesList } from "@/components/templates/templates-list";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemplatesManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatesManagementDialog({
  open,
  onOpenChange,
}: TemplatesManagementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[80vw] !w-[80vw] h-[90vh] flex flex-col p-0 overflow-hidden !z-[200]"
        overlayClassName="!z-[150]"
      >
        <div className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl">Gerenciar Templates</DialogTitle>
            <DialogDescription>
              Crie e gerencie templates de formulários
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <CreateTemplateDialog>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Template
              </Button>
            </CreateTemplateDialog>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="px-6 py-4">
              <TemplatesList />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
