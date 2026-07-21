"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@outfitly/types";

interface CategoryTabBarProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabBar({ categories, activeId, onSelect }: CategoryTabBarProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Tab label="All" active={activeId === null} onClick={() => onSelect(null)} />
      {categories.map((category) => (
        <Tab
          key={category.id}
          label={category.label}
          active={activeId === category.id}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap text-sm transition-colors",
        active ? "font-bold text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
