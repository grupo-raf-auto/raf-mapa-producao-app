import { SearchBar, type SearchItem } from '@/components/ui/search-bar';

const demoData: SearchItem[] = [
  {
    id: 1,
    title: 'Teste Item 1',
    description: 'Esta é uma descrição de teste para o primeiro item.',
    tags: ['Teste', 'Demo', 'Item1'],
  },
  {
    id: 2,
    title: 'Teste Item 2',
    description: 'Esta é uma descrição de teste para o segundo item.',
    tags: ['Teste', 'Demo', 'Item2'],
  },
  {
    id: 3,
    title: 'Outro Exemplo',
    description: 'Um exemplo diferente com outras tags.',
    tags: ['Exemplo', 'Diferente'],
  },
];

export function SearchDemo() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SearchBar Demo</h1>
      <SearchBar
        data={demoData}
        placeholder="Pesquisar itens..."
        onSelect={(item) => {
          console.log('Item selecionado:', item);
          alert(`Selecionou: ${item.title}`);
        }}
        emptyMessage="Nenhum resultado encontrado."
      />
    </div>
  );
}
