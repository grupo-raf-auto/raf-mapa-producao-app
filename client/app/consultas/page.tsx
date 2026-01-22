import { MainLayout } from "@/components/layout/main-layout";
import { ConsultasContent } from "@/components/consultas/consultas-content";

export default function ConsultasPage() {
  return (
    <MainLayout>
      <ConsultasContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
