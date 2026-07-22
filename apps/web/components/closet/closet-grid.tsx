"use client";

import { useState } from "react";
import { Shirt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCategories, useClosetItems, useSeedDemoCloset } from "@/hooks/use-closet";
import { CategoryTabBar } from "./category-tab-bar";
import { ItemCard } from "./item-card";

export function ClosetGrid({ profileId }: { profileId: string }) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const categoriesQuery = useCategories();
  const itemsQuery = useClosetItems(profileId, activeCategoryId);
  const seedDemo = useSeedDemoCloset(profileId);

  return (
    <div className="flex flex-col px-5 pt-6">
      <div className="text-center">
        <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
          Your wardrobe
        </div>
        <h1 className="mb-1 font-heading text-3xl font-bold">Closet</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          {itemsQuery.data ? `${itemsQuery.data.length} items` : " "}
        </p>
      </div>

      <CategoryTabBar
        categories={categoriesQuery.data ?? []}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      <div className="mt-5">
        {itemsQuery.isLoading && (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[1/1.2] rounded-2xl" />
            ))}
          </div>
        )}

        {itemsQuery.data && itemsQuery.data.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <Shirt className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <div className="max-w-2xs text-sm text-muted-foreground">
              Empty for now — photo capture ships in Milestone 1. Seed a few demo pieces to see
              the real Closet grid.
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => seedDemo.mutate()}
              disabled={seedDemo.isPending}
            >
              {seedDemo.isPending ? "Seeding…" : "Seed demo items"}
            </Button>
          </div>
        )}

        {itemsQuery.data && itemsQuery.data.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {itemsQuery.data.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
