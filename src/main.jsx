import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";
import { AuthProvider } from "./store/AuthContext.jsx";
import RealtimeBridge from "./components/common/RealtimeBridge.jsx";
import { notifyError } from "./utils/errorHandler.js";
import { toastSuccess } from "./utils/toast.js";
import { initMonitoring } from "./utils/monitoring.js";

initMonitoring();

// "Continue with Google" needs a real OAuth Client ID from Google Cloud
// Console — see .env.example. Falls back to an empty string rather than
// crashing the whole app if it isn't set yet; the Google button itself
// will just fail to render/authenticate until it is.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

// The browser's own scroll restoration ("auto") fights with each page's
// own scroll-to-top effect on route change — it holds the previous page's
// scroll position for a beat before the effect wins, producing a visible
// flash/jump. Handing scroll restoration entirely to the app removes that
// race.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// After a new deploy, old chunk hashes no longer exist on the server.
// Vite fires this event when a dynamic import chunk fails to load —
// a hard reload fetches the new index.html and fresh chunks.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Boot Pendo with an anonymous visitor. The SDK resolves the previous
// visitor from cookies/localStorage if available, otherwise it falls back
// to a new anonymous visitor. pendo.identify() is called later once the
// user signs in (see AuthContext).
pendo.initialize({ visitor: { id: '' } });

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
 *
 * onSuccess mirrors it for the success side, opt-in rather than opt-out
 * (most mutations close a modal or just re-render and don't need a toast
 * on top of that) via:
 *   useMutation({ ..., meta: { successMessage: "Member added" } })
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
    onSuccess: (data, variables, _context, mutation) => {
      // successMessage can be a string, or a function of (variables, data)
      // for messages that depend on what was actually submitted — e.g.
      // "Your last name was updated" instead of a generic "Profile updated".
      const raw = mutation.options.meta?.successMessage;
      const message = typeof raw === "function" ? raw(variables, data) : raw;
      if (message) toastSuccess(message);
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
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <ErrorBoundary>
          <App />
          </ErrorBoundary>
          <RealtimeBridge />
          <SpeedInsights />
          <Analytics />

          <Toaster
            position="bottom-right"
            closeButton
            icons={{
              success: <CheckCircle2 size={18} className="text-emerald-500" />,
              error: <XCircle size={18} className="text-red-500" />,
              warning: <AlertTriangle size={18} className="text-amber-500" />,
              info: <Info size={18} className="text-brand" />,
              loading: <Loader2 size={18} className="text-gray-400 animate-spin" />,
            }}
            toastOptions={{
              style: {
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
              },
              classNames: {
                toast:
                  "rounded-2xl! border! border-gray-100! shadow-lg! bg-white! text-gray-900!",
                title: "font-medium! text-gray-900!",
                description: "text-xs! text-gray-500!",
                closeButton:
                  "bg-white! border! border-gray-200! text-gray-400! hover:text-gray-600!",
                actionButton:
                  "bg-brand! text-white! rounded-full! text-xs! font-semibold!",
                cancelButton:
                  "bg-gray-100! text-gray-600! rounded-full! text-xs! font-semibold!",
                error: "border-l-4! border-l-red-500!",
                success: "border-l-4! border-l-emerald-500!",
                warning: "border-l-4! border-l-amber-500!",
                info: "border-l-4! border-l-brand!",
                loading: "border-l-4! border-l-gray-300!",
              },
            }}
          />
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
