import { MainLayout } from "@/components/layout/main-layout";
import { FormulariosContent } from "@/components/formularios/formularios-content";

export default function FormulariosPage() {
  return (
    <MainLayout>
      <FormulariosContent />
    </MainLayout>
  );
}

export const dynamic = "force-dynamic";
