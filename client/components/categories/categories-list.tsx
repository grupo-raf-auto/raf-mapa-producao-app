import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient as api } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';

const categoryColors: Record<string, string> = {
  Finance: 'bg-blue-100 text-blue-800',
  Marketing: 'bg-purple-100 text-purple-800',
  HR: 'bg-green-100 text-green-800',
  Tech: 'bg-orange-100 text-orange-800',
  Custom: 'bg-gray-100 text-gray-800',
};

type Category = { _id: string; name: string; description?: string; color?: string };

export async function CategoriesList() {
  const categories = (await api.categories.getAll()) as Category[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Categorias
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Organize questões por categorias
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <Card className="col-span-full shadow-sm">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Nenhuma categoria criada ainda</p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category: Category) => (
            <Card key={category._id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <Badge className={categoryColors[category.name] || categoryColors.Custom}>
                    {category.name}
                  </Badge>
                </div>
                <CardDescription>{category.description || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar</Button>
                  <Button variant="outline" size="sm">Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
