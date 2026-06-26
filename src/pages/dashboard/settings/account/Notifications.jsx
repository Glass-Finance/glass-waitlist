import { useNotificationPreferences } from "../../../../hooks/useNotifications";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
    >
      <div
        className={`relative w-8 h-[20px] rounded-full transition-all duration-300 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}
      >
        <div
          className={`absolute top-0.75 w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[16px]" : "left-0.5"}`}
        />
      </div>
      <span className={`text-xs font-medium ${on ? "text-gray-600" : "text-gray-400"}`}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

function NotifRow({ label, description, value, onChange, last = false }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

export default function Notifications() {
  const { preferences, isLoading, update } = useNotificationPreferences();

  // Defaults to "on" until preferences load, matching the previous behaviour
  const get = (key) => preferences[key] ?? true;

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {isLoading && <p className="text-xs text-gray-400">Loading…</p>}

      <div className="bg-[#EFEFF1] rounded-2xl px-5 pt-4 pb-1" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Notification channels</p>
        <p className="text-xs text-gray-500 mb-4">Choose how you'd like to be notified about activity across your communities.</p>
        <NotifRow label="In-app notifications" description="Show notifications inside the dashboard"  value={get("inAppEnabled")}   onChange={(v) => update("inAppEnabled", v)}   />
        <NotifRow label="Email notifications"  description="Send updates to your email address"        value={get("emailEnabled")}   onChange={(v) => update("emailEnabled", v)}   />
        <NotifRow label="WhatsApp notifications" description="Send updates to your WhatsApp number"    value={get("whatsappEnabled")} onChange={(v) => update("whatsappEnabled", v)} last />
      </div>
    </div>
  );
}
