"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DoorClosed, Globe, Camera, Shirt, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

// 5-slot bottom nav per docs/ARCHITECTURE.md §16 — Capture is a raised
// center action, not a regular tab. Icons are literal (door/globe/shirt/
// camera/person), not abstract — see docs/ARCHITECTURE.md §18.1.
const TABS = [
  { href: "/", label: "Closet", icon: DoorClosed },
  { href: "/discover", label: "Discover", icon: Globe },
] as const;

const TABS_RIGHT = [
  { href: "/outfits", label: "Outfits", icon: Shirt },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div
        className="mx-auto flex max-w-sm items-center justify-between rounded-[22px] border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
      >
        {TABS.map((tab) => (
          <NavLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}

        <Link
          href="/capture"
          aria-label="Capture"
          className="-mt-6 flex size-12 shrink-0 items-center justify-center rounded-full text-[#241407] shadow-[0_4px_20px_-2px_rgba(220,154,92,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform active:scale-95"
          style={{ background: "linear-gradient(160deg, #f0b878, #dc9a5c)" }}
        >
          <Camera className="size-5" />
        </Link>

        {TABS_RIGHT.map((tab) => (
          <NavLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof DoorClosed;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-14 flex-col items-center gap-1.5 py-1 text-[10px] transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={2} />
      {label}
    </Link>
  );
}
