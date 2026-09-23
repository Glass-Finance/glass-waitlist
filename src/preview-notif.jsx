import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./store/AuthContext";
import NotificationsPanel from "./components/dashboard/NotificationsPanel";

const now = Date.now();
const notifications = [
  {
    id: "n1",
    notificationType: "MEMBER_JOINED",
    title: "Amina Bello requested to join",
    message: "Confirm or decline her membership request.",
    createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
    readFlag: false,
  },
  {
    id: "n2",
    notificationType: "PAYMENT_RECEIVED",
    title: "Payment of ₦5,000 received",
    message: "From Chidi Okafor via direct bank transfer.",
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    readFlag: false,
  },
  {
    id: "n3",
    notificationType: "ACCOUNT",
    title: "Welcome to Glass",
    message: "Your admin workspace is ready.",
    createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    readFlag: true,
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export default function Preview() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="p-6">
            <div className="relative inline-block">
              <NotificationsPanel
                notifications={notifications}
                isLoading={false}
                unreadCount={2}
                communityMap={{}}
                onMarkRead={() => {}}
                onMarkAllRead={() => {}}
                onClearAll={() => {}}
                isClearingAll={false}
                onClose={() => {}}
              />
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
