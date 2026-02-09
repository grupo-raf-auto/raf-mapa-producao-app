import { NavBar } from "@/components/ui/tubelight-navbar";
import { LayoutDashboard, Search, FileStack } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const baseNavigation = [
  { name: "Dashboard", url: "/", icon: LayoutDashboard },
  { name: "Consultas", url: "/consultas", icon: Search },
  { name: "Templates", url: "/templates", icon: FileStack },
];

export function NavbarWrapper() {
  const { isAdmin } = useAuth();
  const navigation = baseNavigation.filter(
    (item) => item.url !== "/templates" || isAdmin
  );
  return <NavBar items={navigation} />;
}
