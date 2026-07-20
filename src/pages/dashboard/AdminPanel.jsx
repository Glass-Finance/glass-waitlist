import { useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Building2,
  Users,
  CreditCard,
  BarChart2,
  Bell,
  Wallet,
  SlidersHorizontal,
  Landmark,
  Scale,
} from "lucide-react";
import SystemConfig from "./settings/admin/SystemConfig";
import CommunitiesSection from "./admin-panel/CommunitiesSection";
import AccountsSection from "./admin-panel/AccountsSection";
import UsersSection from "./admin-panel/UsersSection";
import PaymentLinksSection from "./admin-panel/PaymentLinksSection";
import BalancesSection from "./admin-panel/BalancesSection";
import SettlementsSection from "./admin-panel/SettlementsSection";
import ReconciliationSection from "./admin-panel/ReconciliationSection";
import NotificationsSection from "./admin-panel/NotificationsSection";

const TABS = [
  { id: "communities", label: "Communities", Icon: Building2 },
  { id: "accounts", label: "Accounts", Icon: Wallet },
  { id: "users", label: "Users", Icon: Users },
  { id: "payment-links", label: "Payment Links", Icon: CreditCard },
  { id: "balances", label: "Balances", Icon: BarChart2 },
  { id: "settlements", label: "Settlements", Icon: Landmark },
  { id: "reconciliation", label: "Reconciliation", Icon: Scale },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "system-config", label: "System Config", Icon: SlidersHorizontal },
];

export default function AdminPanel() {
  usePageTitle("Admin Panel");
  const [activeTab, setActiveTab] = useState("communities");

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 min-h-full">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Platform Admin</h1>
        <p className="text-xs text-gray-400">
          Glass internal operations — not visible to community owners.
        </p>
      </div>

      <div className="overflow-x-auto mb-8">
        <div
          className="flex gap-1 bg-stacked-container rounded-xl p-1 w-fit border border-[#f0f0f0]"
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border-none ${
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "communities" && <CommunitiesSection />}
      {activeTab === "accounts" && <AccountsSection />}
      {activeTab === "users" && <UsersSection />}
      {activeTab === "payment-links" && <PaymentLinksSection />}
      {activeTab === "balances" && <BalancesSection />}
      {activeTab === "settlements" && <SettlementsSection />}
      {activeTab === "reconciliation" && <ReconciliationSection />}
      {activeTab === "notifications" && <NotificationsSection />}
      {activeTab === "system-config" && <SystemConfig />}
    </div>
  );
}
