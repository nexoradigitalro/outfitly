import Image from "next/image";
import { Shirt } from "lucide-react";
import type { ClosetItem } from "@outfitly/types";

// Prism cards show the photo + name only — no floating stat/percentage/price
// badge on the grid tile (docs/ARCHITECTURE.md §18.1 / §15: that pattern read
// as a game-inventory slot in early design-direction mockups). Cost-per-wear
// etc. belong in the detail view, once it exists.
export function ItemCard({ item }: { item: ClosetItem }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_20px_-12px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5">
      <div
        className="relative flex aspect-[1/0.92] items-center justify-center overflow-hidden rounded-[11px]"
        style={{
          background:
            "radial-gradient(120% 120% at 25% 15%, rgba(255,255,255,0.09), rgba(255,255,255,0.03) 60%)",
        }}
      >
        {item.imageUrl ? (
          // Background removal / thumbnailing (docs/ARCHITECTURE.md §12)
          // isn't built yet, so this is often the unprocessed original —
          // still a real photo of the real item, shown as-is.
          <Image
            src={item.imageUrl}
            alt={item.name ?? "Closet item"}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover"
          />
        ) : (
          <Shirt
            className="size-[46%]"
            style={{ color: item.primaryColorHex ?? "var(--muted-foreground)" }}
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="px-0.5 text-xs font-semibold leading-tight">
        {item.name ?? "Untitled item"}
      </div>
    </div>
  );
}
