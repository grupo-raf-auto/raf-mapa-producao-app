"use client";

import { Search, User, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { ModelSwitcher } from "./model-switcher";

export function Topbar() {
  const router = useRouter();
  const { userRole, loading } = useUserRole();

  return (
    <header
      className="h-16 bg-card/80 backdrop-blur-sm border-b border-border fixed top-0 left-0 right-0 w-full z-50 flex items-center px-6"
      style={{ paddingLeft: "calc(5rem + 6rem + 1.5rem)" }}
    >
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar..."
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {/* NEW: Model Switcher */}
        <ModelSwitcher />

        {!loading && userRole === "admin" && (
          <Button
            onClick={() => router.push("/admin")}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        )}
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors">
          <User className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
