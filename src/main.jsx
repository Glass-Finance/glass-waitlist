import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./store/AuthContext.jsx";

/**
 * QueryClient — React Query
 * ─────────────────────────
 * Handles all API calls: caching, background refetching, loading/error states.
 * Instead of writing useEffect + fetch everywhere, you call useQuery() / useMutation()
 * and React Query manages the lifecycle. The staleTime below means data won't
 * re-fetch for 60s after it was last fetched — good for dashboard stats.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 60s before data is considered stale
      retry: 1, // retry failed requests once
      refetchOnWindowFocus: false, // don't refetch just because user switches tabs
    },
  },
});

/**
 * Toaster (sonner)
 * ─────────────────
 * Global toast notifications. Any component can call toast("message") or
 * toast.success() / toast.error() without prop-drilling. Shows payment
 * confirmations, error alerts, reminder sent notices, etc.
 * Install: npm install sonner
 */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/*
      QueryClientProvider — wraps the whole app so any component can use
      useQuery / useMutation to fetch from your backend without passing
      fetch functions as props.
    */}
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />

        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
