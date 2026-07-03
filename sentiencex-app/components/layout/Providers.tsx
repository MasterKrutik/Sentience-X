"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import AlertOverlay from "@/components/layout/AlertOverlay";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AlertOverlay />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(18% 0.02 270)",
            border: "1px solid oklch(25% 0.025 270)",
            color: "oklch(92% 0.01 270)",
            fontFamily: "'DM Sans', sans-serif",
          },
        }}
        richColors
      />
    </QueryClientProvider>
  );
}
