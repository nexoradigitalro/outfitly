"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ClosetItem } from "@outfitly/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useUpdateClosetItem, useArchiveClosetItem } from "@/hooks/use-closet";
import { cn } from "@/lib/utils";

interface ItemDetailSheetProps {
  item: ClosetItem | null;
  onOpenChange: (open: boolean) => void;
}

// The AI-prefilled version of this form (ARCHITECTURE.md §15 ItemEditSheet)
// lands with the tagging pipeline; until then every field here is exactly
// what CaptureForm collected manually, just editable after the fact.
// The parent renders this with `key={item?.id}` so a fresh instance mounts
// per item — state is seeded straight from props via lazy initializers,
// no effect-based sync needed to reset the form when the selection changes.
export function ItemDetailSheet({ item, onOpenChange }: ItemDetailSheetProps) {
  const [name, setName] = useState(() => item?.name ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(() => item?.categoryId ?? null);
  const [colorHex, setColorHex] = useState(() => item?.primaryColorHex ?? "#7c8a5c");

  const categoriesQuery = useCategories();
  const updateItem = useUpdateClosetItem();
  const archiveItem = useArchiveClosetItem();

  if (!item) return null;

  async function handleSave() {
    if (!item || !name.trim()) return;
    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        input: { name: name.trim(), categoryId, primaryColorHex: colorHex },
      });
      toast.success("Saved");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save — try again.");
    }
  }

  async function handleToggleFavorite() {
    if (!item) return;
    try {
      await updateItem.mutateAsync({ itemId: item.id, input: { isFavorite: !item.isFavorite } });
    } catch {
      toast.error("Couldn't update — try again.");
    }
  }

  async function handleRemove() {
    if (!item) return;
    try {
      await archiveItem.mutateAsync(item.id);
      toast.success("Removed from closet");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't remove — try again.");
    }
  }

  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>Edit item</SheetTitle>
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground"
            >
              <Heart
                className={cn("size-5", item.isFavorite && "fill-primary text-primary")}
                strokeWidth={1.5}
              />
            </button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border bg-card"
            style={{
              background:
                "radial-gradient(120% 120% at 25% 15%, rgba(255,255,255,0.09), rgba(255,255,255,0.03) 60%)",
            }}
          >
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name ?? "Closet item"} fill className="object-cover" />
            ) : (
              <Shirt className="size-16" style={{ color: item.primaryColorHex ?? undefined }} strokeWidth={1.5} />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              items={(categoriesQuery.data ?? []).map((category) => ({
                value: category.id,
                label: category.label,
              }))}
            >
              <SelectTrigger id="edit-category" className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {(categoriesQuery.data ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-color">Primary color</Label>
            <div className="flex items-center gap-3">
              <input
                id="edit-color"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="size-9 cursor-pointer rounded-lg border border-input bg-transparent"
              />
              <span className="font-mono text-sm text-muted-foreground">{colorHex}</span>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            size="lg"
            disabled={!name.trim() || updateItem.isPending}
            onClick={handleSave}
          >
            {updateItem.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={archiveItem.isPending}
            onClick={handleRemove}
            className="text-destructive"
          >
            <Trash2 className="size-4" />
            {archiveItem.isPending ? "Removing…" : "Remove from closet"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
