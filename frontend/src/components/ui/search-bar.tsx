import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpAZ, ArrowDownAZ, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface SearchItem {
  id: string | number;
  title: string;
  description?: string;
  tags?: string[];
}

interface SearchBarProps {
  data: SearchItem[];
  placeholder?: string;
  onSelect?: (item: SearchItem) => void;
  emptyMessage?: string;
  scrollHeight?: string;
}

const SearchBar = ({
  data,
  placeholder = "Pesquisar...",
  onSelect,
  emptyMessage = "Sem resultados.",
  scrollHeight = "h-72",
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  const [filteredData, setFilteredData] = useState(data);

  // Update filtered data when query, sort, or data changes
  useEffect(() => {
    const lowerCaseQuery = query.toLowerCase().trim();

    // If no query, show all items
    let results = lowerCaseQuery
      ? data.filter(
          (item) =>
            item.title.toLowerCase().includes(lowerCaseQuery) ||
            item.description?.toLowerCase().includes(lowerCaseQuery) ||
            item.tags?.some((tag) => tag.toLowerCase().includes(lowerCaseQuery))
        )
      : [...data];

    if (sortOrder === "asc") {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "desc") {
      results.sort((a, b) => b.title.localeCompare(a.title));
    }

    setFilteredData(results);
  }, [query, sortOrder, data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("Search input changed:", newValue); // Debug log
    setQuery(newValue);
  };

  const handleItemClick = (item: SearchItem) => {
    console.log("Item clicked:", item); // Debug log
    onSelect?.(item);
  };

  console.log("SearchBar render - data length:", data.length, "filtered:", filteredData.length); // Debug log

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Search Input and Sort Dropdown */}
      <div className="flex gap-3">
        {/* Search Bar with Icon */}
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            className="w-full pr-10"
            onChange={handleInputChange}
            value={query}
          />
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={18}
          />
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shrink-0">
              Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setSortOrder("asc")}
              className="flex justify-between items-center cursor-pointer"
            >
              <span>Ascendente</span>
              <ArrowUpAZ className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOrder("desc")}
              className="flex justify-between items-center cursor-pointer"
            >
              <span>Descendente</span>
              <ArrowDownAZ className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Results with Scroll */}
      <ScrollArea className={`${scrollHeight} w-full border rounded-md overflow-hidden`}>
        <div className="p-4 space-y-4 min-h-full">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-card text-card-foreground p-4 rounded-lg border shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <h3 className="text-lg font-medium leading-none">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {item.description}
                  </p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {emptyMessage}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export { SearchBar };
