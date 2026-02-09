/**
 * GlobalSearch Component
 *
 * Componente pronto para ser adicionado ao layout principal da aplicação.
 * Fornece pesquisa global com atalho Ctrl+K em toda a aplicação.
 *
 * @example
 * // No seu MainLayout ou App.tsx:
 * import { GlobalSearch } from '@/components/ui/global-search';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourContent />
 *       <GlobalSearch />
 *     </>
 *   );
 * }
 */

import { SearchBar, type SearchItem } from "@/components/ui/search-bar";
import { useSearch } from "@/hooks/use-search";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// TODO: Substitua por seus dados reais
// Você pode buscar de uma API, context, ou qualquer fonte de dados
const useGlobalSearchData = (): SearchItem[] => {
  // Exemplo: const { data } = useQuery(['search-data'], fetchSearchData);
  // return data || [];

  // Por enquanto, retorna array vazio - adicione sua lógica aqui
  return [];
};

export function GlobalSearch() {
  const { isOpen, setIsOpen } = useSearch({ enabled: true });
  const navigate = useNavigate();
  const searchData = useGlobalSearchData();

  const handleSelect = (item: SearchItem) => {
    // Navegação baseada em categoria
    switch (item.category) {
      case "horizon":
        // Navegar para a página
        // navigate(`/pages/${item.id}`);
        break;
      case "knowledge":
        // Abrir documentação
        // navigate(`/docs/${item.id}`);
        break;
      case "actions":
        // Executar ação
        // executeAction(item.id);
        break;
      case "reports":
        // Abrir relatório
        // navigate(`/reports/${item.id}`);
        break;
      default:
        break;
    }

    toast.success(`Navegando para: ${item.title}`);
  };

  const handleAskAI = (query: string) => {
    // TODO: Integre com seu serviço de IA
    // Exemplo:
    // await fetch('/api/ai/search', {
    //   method: 'POST',
    //   body: JSON.stringify({ query }),
    // });

    toast.info(`Consulta AI: "${query}"`);
  };

  return (
    <SearchBar
      data={searchData}
      placeholder="Pesquisar em toda a plataforma... (Ctrl+K)"
      onSelect={handleSelect}
      onAskAI={handleAskAI}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      emptyMessage="Nenhum resultado encontrado"
    />
  );
}
