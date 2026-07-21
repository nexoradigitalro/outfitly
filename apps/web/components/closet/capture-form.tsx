"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-closet";
import { useAddClosetItem } from "@/hooks/use-add-closet-item";

const DEFAULT_COLOR = "#7c8a5c";

export function CaptureForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [colorHex, setColorHex] = useState(DEFAULT_COLOR);

  const categoriesQuery = useCategories();
  const addItem = useAddClosetItem(profileId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSave() {
    if (!file || !name.trim()) return;
    try {
      await addItem.mutateAsync({
        file,
        name: name.trim(),
        categoryId: categoryId ?? undefined,
        primaryColorHex: colorHex,
      });
      toast.success("Added to your closet");
      router.push("/");
    } catch {
      toast.error("Couldn't save — try again.");
    }
  }

  const canSave = !!file && name.trim().length > 0 && !addItem.isPending;

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
          Add to closet
        </div>
        <h1 className="font-heading text-3xl font-bold">Capture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI background removal & tagging land later (docs/ARCHITECTURE.md §12) — for now, name
          and tag it yourself.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-card"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a remote image
          <img src={previewUrl} alt="Selected item" className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Camera className="size-8" strokeWidth={1.5} />
            <span className="text-sm">Tap to take or choose a photo</span>
          </div>
        )}
      </button>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-name">Name</Label>
          <Input
            id="item-name"
            placeholder="Olive Field Shirt"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="item-category" className="w-full">
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
          <Label htmlFor="item-color">Primary color</Label>
          <div className="flex items-center gap-3">
            <input
              id="item-color"
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="size-9 cursor-pointer rounded-lg border border-input bg-transparent"
            />
            <span className="font-mono text-sm text-muted-foreground">{colorHex}</span>
          </div>
        </div>
      </div>

      <Button size="lg" disabled={!canSave} onClick={handleSave}>
        {addItem.isPending ? "Saving…" : "Add to closet"}
      </Button>
    </div>
  );
}
