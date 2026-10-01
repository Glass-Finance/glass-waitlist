import { useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useRegisterShortcutGroup } from "../../hooks/useKeyboardShortcuts";
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
  ShieldCheck,
  Receipt,
  FileClock,
  ScrollText,
} from "lucide-react";
import SystemConfig from "./settings/admin/SystemConfig";
import CommunitiesSection from "./platform-admin/CommunitiesSection";
import AccountsSection from "./platform-admin/AccountsSection";
import UsersSection from "./platform-admin/UsersSection";
import PaymentLinksSection from "./platform-admin/PaymentLinksSection";
import BalancesSection from "./platform-admin/BalancesSection";
import SettlementsSection from "./platform-admin/SettlementsSection";
import ReconciliationSection from "./platform-admin/ReconciliationSection";
import NotificationsSection from "./platform-admin/NotificationsSection";
import KycSection from "./platform-admin/KycSection";
import TransactionsSection from "./platform-admin/TransactionsSection";
import ObligationsSection from "./platform-admin/ObligationsSection";
import AuditLogsSection from "./platform-admin/AuditLogsSection";

// Order is grouped by domain rather than alphabetical, and the digit
// shortcuts below are positional — so inserting a tab renumbers the keys
// after it. The three ops views sit either side of Reconciliation so the
// money-and-ledger group (settlements → transactions → obligations →
// reconciliation → audit logs) reads in one run.
const TABS = [
  { id: "communities", label: "Communities", Icon: Building2 },
  { id: "accounts", label: "Accounts", Icon: Wallet },
  { id: "users", label: "Users", Icon: Users },
  { id: "payment-links", label: "Payment Links", Icon: CreditCard },
  { id: "balances", label: "Balances", Icon: BarChart2 },
  { id: "settlements", label: "Settlements", Icon: Landmark },
  { id: "transactions", label: "Transactions", Icon: Receipt },
  { id: "obligations", label: "Obligations", Icon: FileClock },
  { id: "reconciliation", label: "Reconciliation", Icon: Scale },
  { id: "audit-logs", label: "Audit Logs", Icon: ScrollText },
  { id: "kyc", label: "KYC", Icon: ShieldCheck },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "system-config", label: "System Config", Icon: SlidersHorizontal },
];

export default function PlatformAdmin() {
  usePageTitle("Admin Panel");
  const [activeTab, setActiveTab] = useState("communities");

  // Digit keys, not "g <letter>" chords -- this page's own 13 tabs are a
  // sub-navigation *within* wherever "g a" already landed you, not another
  // top-level destination, so borrowing the "go to a page" prefix here would
  // blur that distinction. Numbered tabs is the same convention browser tab
  // switching and Slack channel-jumping already use.
  const tabShortcuts = useMemo(
    () =>
      TABS.map(({ id, label }, i) => ({
        keys: String(i + 1),
        description: `Switch to ${label}`,
        handler: () => setActiveTab(id),
      })),
    [],
  );
  useRegisterShortcutGroup(tabShortcuts, "Platform Admin");

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 min-h-full">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Platform Admin</h1>
        <p className="text-xs text-gray-400">
          Glass internal operations — not visible to community owners.
        </p>
      </div>

      <div className="overflow-x-auto mb-8">
        <div className="flex gap-1 bg-stacked-container rounded-xl p-1 w-fit border border-[#f0f0f0]">
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
      {activeTab === "transactions" && <TransactionsSection />}
      {activeTab === "obligations" && <ObligationsSection />}
      {activeTab === "reconciliation" && <ReconciliationSection />}
      {activeTab === "audit-logs" && <AuditLogsSection />}
      {activeTab === "kyc" && <KycSection />}
      {activeTab === "notifications" && <NotificationsSection />}
      {activeTab === "system-config" && <SystemConfig />}
    </div>
  );
}
