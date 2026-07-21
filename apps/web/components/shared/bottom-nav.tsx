"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shirt, Sparkles, Camera, Grid2x2, User } from "lucide-react";
import { cn } from "@/lib/utils";

// 5-slot bottom nav per docs/ARCHITECTURE.md §16 — Capture is a raised
// center action, not a regular tab.
const TABS = [
  { href: "/", label: "Closet", icon: Shirt },
  { href: "/discover", label: "Discover", icon: Sparkles },
] as const;

const TABS_RIGHT = [
  { href: "/outfits", label: "Outfits", icon: Grid2x2 },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-2">
        {TABS.map((tab) => (
          <NavLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}

        <Link
          href="/capture"
          aria-label="Capture"
          className="-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Camera className="size-6" />
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
  icon: typeof Shirt;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-16 flex-col items-center gap-1 py-3 text-xs transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
