"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { flushPendingSample } from "@/lib/db/pending-progress";
import { PreferencesProvider } from "@/features/settings/PreferencesContext";
import { ToastProvider } from "@/components/ui/Toast";
import { SearchOverlayProvider } from "@/features/search/overlay/SearchOverlay";
import { QUERY } from "@/config/app";
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { gcTime: QUERY.gcMs, refetchOnWindowFocus: false, retry: 1, networkMode: "always" } } }));
  useEffect(() => { void flushPendingSample(); }, []);
  return <QueryClientProvider client={client}><PreferencesProvider><ToastProvider><SearchOverlayProvider>{children}</SearchOverlayProvider></ToastProvider></PreferencesProvider></QueryClientProvider>;
}
