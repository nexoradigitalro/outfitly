"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { createClosetItem, uploadClosetImage } from "@outfitly/api-client";

export interface AddClosetItemInput {
  file: File;
  name: string;
  categoryId?: string;
  primaryColorHex: string;
}

// Manual capture path (M1, pre-AI): real photo upload + real insert, no
// AI-prefill yet — that lands with the background-removal/tagging Edge
// Function (docs/ARCHITECTURE.md §11-12), which needs an AI provider chosen
// and its key configured before it can be built.
export function useAddClosetItem(profileId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddClosetItemInput) => {
      if (!profileId) throw new Error("No profile");
      const supabase = createClient();
      const imagePath = await uploadClosetImage(supabase, profileId, input.file);
      return createClosetItem(supabase, profileId, {
        name: input.name,
        categoryId: input.categoryId,
        primaryColorHex: input.primaryColorHex,
        imageOriginalPath: imagePath,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["closet-items"] });
    },
  });
}
