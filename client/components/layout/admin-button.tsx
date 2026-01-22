"use client";

import { Shield, LogOut, Bug, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { useModal } from "@/lib/contexts/modal-context";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";

export function AdminButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { userRole, loading } = useUserRole();
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugDescription, setBugDescription] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);
  const { isModalOpen } = useModal();

  const user = session?.user;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/sign-in");
      router.refresh();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  const handleSubmitBug = async () => {
    if (!bugDescription.trim()) {
      toast.error("Descreva o bug");
      return;
    }
    setSubmittingBug(true);
    try {
      console.log("Bug:", {
        description: bugDescription,
        userEmail: user?.email,
        userRole,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
      });
      toast.success("Bug reportado. Obrigado.");
      setBugDescription("");
      setBugReportOpen(false);
    } catch (e) {
      toast.error("Erro ao reportar");
    } finally {
      setSubmittingBug(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !user) return null;
  if (isModalOpen) return null;

  const showAdmin = userRole === "admin";

  return (
    <div className="flex justify-end mb-4">
      <div className="flex items-center gap-2">
        {showAdmin && (
          <Button
            onClick={() => router.push("/admin")}
            variant="default"
            size="sm"
            className="gap-2 shadow-lg"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Administração</span>
          </Button>
        )}
        <Button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          variant="outline"
          size="sm"
          className="gap-2 shadow-lg"
          title={mounted && theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
        <Dialog open={bugReportOpen} onOpenChange={setBugReportOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-lg"
              title="Reportar Bug"
            >
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">Reportar Bug</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reportar Bug</DialogTitle>
              <DialogDescription>
                Descreva o problema. A sua ajuda é importante.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="bug">Descrição</Label>
                <Textarea
                  id="bug"
                  placeholder="O que aconteceu?"
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  rows={6}
                  className="mt-2 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBugReportOpen(false);
                    setBugDescription("");
                  }}
                  disabled={submittingBug}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitBug}
                  disabled={submittingBug || !bugDescription.trim()}
                >
                  {submittingBug ? "A enviar..." : "Enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="gap-2 shadow-lg"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </div>
  );
}
