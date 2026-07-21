"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { listCategories, listClosetItems, createClosetItem } from "@outfitly/api-client";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(createClient()),
    staleTime: Infinity, // reference data, seeded once in the core migration
  });
}

export function useClosetItems(profileId: string | undefined, categoryId: string | null) {
  return useQuery({
    queryKey: ["closet-items", profileId, categoryId],
    queryFn: () => listClosetItems(createClient(), profileId!, categoryId ?? undefined),
    enabled: !!profileId,
  });
}

// Temporary, dev-only: lets the empty Closet demo the real Prism grid before
// the M1 capture pipeline (photo -> background removal -> AI tagging) exists.
// Inserts through the same createClosetItem() path that pipeline will use,
// under the visitor's own RLS-scoped session — remove once capture ships.
const DEMO_ITEMS = [
  { name: "Olive Field Shirt", primaryColorHex: "#7c8a5c", categorySlug: "tops" },
  { name: "Rust Chino", primaryColorHex: "#a35a34", categorySlug: "bottoms" },
  { name: "Waxed Chore Jacket", primaryColorHex: "#6b5238", categorySlug: "outerwear" },
  { name: "Suede Desert Boot", primaryColorHex: "#b08a5f", categorySlug: "shoes" },
] as const;

export function useSeedDemoCloset(profileId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("No profile");
      const supabase = createClient();
      const categories = await listCategories(supabase);

      for (const demoItem of DEMO_ITEMS) {
        const category = categories.find((c) => c.slug === demoItem.categorySlug);
        await createClosetItem(supabase, profileId, {
          name: demoItem.name,
          primaryColorHex: demoItem.primaryColorHex,
          categoryId: category?.id,
          imageOriginalPath: `${profileId}/demo/${demoItem.categorySlug}.jpg`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closet-items"] });
    },
  });
}
