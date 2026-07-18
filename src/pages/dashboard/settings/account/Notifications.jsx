import { useNotificationPreferences } from "../../../../hooks/useNotifications";
import Toggle from "../../../../components/common/Toggle";

function NotifRow({ label, description, value, onChange, disabled, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? "border-b border-gray-100" : ""}`}>
      <div className="min-w-0 pr-4">
        <p className="text-xs font-medium text-gray-900 m-0">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 m-0">{description}</p>}
      </div>
      <Toggle on={!!value} onChange={onChange} disabled={disabled} showLabel />
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-surface-container rounded-2xl px-5 pt-4 pb-2" style={{ border: "1px solid var(--color-surface-container-border)" }}>
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

  // When preferences failed to load, the values shown are just defaults —
  // letting the user flip them would save against unknown server state.
  const Row = (props) => <NotifRow disabled={!!error} {...props} />;

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
            <Row
              label="In-app notifications"
              description="Show notifications inside the dashboard"
              value={get("inAppEnabled")}
              onChange={(v) => update("inAppEnabled", v)}
            />
            <Row
              label="Email notifications"
              description="Send updates to your email address"
              value={get("emailEnabled")}
              onChange={(v) => update("emailEnabled", v)}
            />
            <Row
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
            <Row
              label="Payment reminders"
              description="Remind members before a payment is due"
              value={get("paymentReminderEnabled")}
              onChange={(v) => update("paymentReminderEnabled", v)}
            />
            <Row
              label="Payment receipts"
              description="Confirmation when a member's payment goes through"
              value={get("paymentReceiptEnabled")}
              onChange={(v) => update("paymentReceiptEnabled", v)}
            />
            <Row
              label="Failed payments"
              description="Alert when a member's payment fails or is declined"
              value={get("paymentFailureEnabled")}
              onChange={(v) => update("paymentFailureEnabled", v)}
            />
            <Row
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
            <Row
              label="New member joins"
              description="When someone joins or accepts an invite to your community"
              value={get("memberJoinEnabled")}
              onChange={(v) => update("memberJoinEnabled", v)}
            />
            <Row
              label="Community updates"
              description="Announcements and changes within your communities"
              value={get("communityUpdateEnabled")}
              onChange={(v) => update("communityUpdateEnabled", v)}
            />
            <Row
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
