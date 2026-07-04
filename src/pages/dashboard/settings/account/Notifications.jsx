import { useNotificationPreferences } from "../../../../hooks/useNotifications";

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      className="flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none p-0"
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
    >
      <div
        className={`relative w-8 h-[20px] rounded-full transition-all duration-300 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}
      >
        <div
          className={`absolute top-0.5 w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[17px]" : "left-0.5"}`}
        />
      </div>
      <span className={`text-xs font-medium ${on ? "text-gray-600" : "text-gray-400"}`}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

function NotifRow({ label, description, value, onChange, disabled, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? "border-b border-gray-100" : ""}`}>
      <div className="min-w-0 pr-4">
        <p className="text-xs font-medium text-gray-900 m-0">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 m-0">{description}</p>}
      </div>
      <Toggle on={!!value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-[#EFEFF1] rounded-2xl px-5 pt-4 pb-2" style={{ border: "1px solid #E5E7EB" }}>
      <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

function SkeletonRow({ last }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? "border-b border-gray-100" : ""}`}>
      <div>
        <div className="w-36 h-3 rounded-md bg-gray-200 mb-1.5" />
        <div className="w-52 h-2.5 rounded-md bg-gray-100" />
      </div>
      <div className="w-12 h-5 rounded-full bg-gray-200 flex-shrink-0" />
    </div>
  );
}

export default function Notifications() {
  const { preferences, isLoading, error, update } = useNotificationPreferences();

  const get = (key, defaultVal = true) => preferences[key] ?? defaultVal;

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Error banner */}
      {error && !isLoading && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs text-red-600 m-0">Couldn't load preferences. Check your connection.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-red-600 bg-transparent border-none cursor-pointer ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Channels ─────────────────────────────────────────────────────────── */}
      <SectionCard
        title="Notification channels"
        subtitle="Choose how you'd like to be notified about activity across your communities."
      >
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow last />
          </>
        ) : (
          <>
            <NotifRow
              label="In-app notifications"
              description="Show notifications inside the dashboard"
              value={get("inAppEnabled")}
              onChange={(v) => update("inAppEnabled", v)}
            />
            <NotifRow
              label="Email notifications"
              description="Send updates to your email address"
              value={get("emailEnabled")}
              onChange={(v) => update("emailEnabled", v)}
            />
            <NotifRow
              label="WhatsApp notifications"
              description="Send updates to your WhatsApp number"
              value={get("whatsappEnabled")}
              onChange={(v) => update("whatsappEnabled", v)}
              last
            />
          </>
        )}
      </SectionCard>

      {/* ── Payments ─────────────────────────────────────────────────────────── */}
      <SectionCard
        title="Payments"
        subtitle="Stay on top of payment activity in your communities."
      >
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow last />
          </>
        ) : (
          <>
            <NotifRow
              label="Payment reminders"
              description="Remind members before a payment is due"
              value={get("paymentReminderEnabled")}
              onChange={(v) => update("paymentReminderEnabled", v)}
            />
            <NotifRow
              label="Payment receipts"
              description="Confirmation when a member's payment goes through"
              value={get("paymentReceiptEnabled")}
              onChange={(v) => update("paymentReceiptEnabled", v)}
            />
            <NotifRow
              label="Failed payments"
              description="Alert when a member's payment fails or is declined"
              value={get("paymentFailureEnabled")}
              onChange={(v) => update("paymentFailureEnabled", v)}
            />
            <NotifRow
              label="Auto-Pay alerts"
              description="Notified when a member's auto-pay charge is processed"
              value={get("autoPayAlertEnabled")}
              onChange={(v) => update("autoPayAlertEnabled", v)}
              last
            />
          </>
        )}
      </SectionCard>

      {/* ── Community & Members ───────────────────────────────────────────────── */}
      <SectionCard
        title="Community & Members"
        subtitle="Get notified about membership and community activity."
      >
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow last />
          </>
        ) : (
          <>
            <NotifRow
              label="New member joins"
              description="When someone joins or accepts an invite to your community"
              value={get("memberJoinEnabled")}
              onChange={(v) => update("memberJoinEnabled", v)}
            />
            <NotifRow
              label="Community updates"
              description="Announcements and changes within your communities"
              value={get("communityUpdateEnabled")}
              onChange={(v) => update("communityUpdateEnabled", v)}
            />
            <NotifRow
              label="Invitations sent"
              description="When a new invite link is created or used"
              value={get("inviteNotificationEnabled")}
              onChange={(v) => update("inviteNotificationEnabled", v)}
              last
            />
          </>
        )}
      </SectionCard>

      {/* Info note */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
        <div className="w-4 h-4 rounded-full border border-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[9px] font-bold text-blue-600">i</span>
        </div>
        <p className="text-xs text-gray-600 m-0 leading-relaxed">
          Changes take effect immediately. Critical security alerts are always sent regardless of your preferences.
        </p>
      </div>
    </div>
  );
}
