import { useState } from "react";
import { LayoutDashboard, Search, ListChecks, Settings, X } from "lucide-react";

export const DASHBOARD_TOUR_SEEN_KEY = "glass_dashboard_tour_seen";

const STEPS = [
  {
    icon: LayoutDashboard,
    title: "Welcome to your dashboard",
    body: "This is where you manage your community's dues, members, and payment plans. Let's take a quick look around.",
  },
  {
    icon: LayoutDashboard,
    title: "Switch communities and pages from the sidebar",
    body: "The sidebar on the left lets you jump between communities you belong to, and move between Dashboard, Payment Plans, Members, Notifications, and Settings.",
  },
  {
    icon: Search,
    title: "Search finds members and payments fast",
    body: "Use the search bar at the top to quickly look up members, transactions, and payment links without leaving the page you're on.",
  },
  {
    icon: ListChecks,
    title: "Follow your Getting Started checklist",
    body: "New communities see a checklist for the essentials — creating a payment plan, adding members, and setting up your payout account. It updates automatically as you complete each step.",
  },
  {
    icon: Settings,
    title: "You're all set",
    body: "That covers the basics. You can always replay this tour from the help icon next to your notifications.",
  },
];

export default function DashboardTour({ onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#E6EEFF" }}
          >
            <Icon size={20} className="text-[#002FA7]" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer bg-transparent border-none transition-colors"
            aria-label="Close tour"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <h2 className="text-base font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? "#002FA7" : "#E5E7EB",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer border-none hover:opacity-90 transition-opacity"
              style={{ background: "#002FA7" }}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
