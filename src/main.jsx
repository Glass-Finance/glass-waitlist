import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./store/AuthContext.jsx";
import { notifyError } from "./utils/errorHandler.js";

/**
 * QueryClient — React Query
 * ─────────────────────────
 * Handles all API calls: caching, background refetching, loading/error states.
 * Instead of writing useEffect + fetch everywhere, you call useQuery() / useMutation()
 * and React Query manages the lifecycle. The staleTime below means data won't
 * re-fetch for 60s after it was last fetched — good for dashboard stats.
 *
 * mutationCache.onError is the single place every mutation's error lands —
 * registration, payments, member management, settings updates, everywhere —
 * without each of the ~40 useMutation call sites across the app needing its
 * own onError. A hook can still set its own onError (e.g. to roll back an
 * optimistic update) without losing this: that local handler runs first,
 * and the toast still fires here afterward, since this is the cache-level
 * callback rather than a per-mutation override.
 */
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // A mutation can opt out of the global toast (e.g. it already shows
      // its own inline error and a toast would be redundant) via:
      //   useMutation({ ..., meta: { silentError: true } })
      if (mutation.options.meta?.silentError) return;
      notifyError(error, { context: mutation.options.mutationKey?.join(".") });
    },
  }),
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
