"use client";

import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* Prism (docs/ARCHITECTURE.md §18.1) IS the dark theme — light-mode
          tokens don't exist yet, so no system/light switching until they do. */}
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        {children}
        <Toaster position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
