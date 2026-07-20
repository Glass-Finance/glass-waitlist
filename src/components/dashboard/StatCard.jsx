// Shared stat tile used across dashboard list pages (Payments, Members,
// MemberDetail). icon/iconCls are optional — MemberDetail's usage omits
// the icon block entirely.
export default function StatCard({ icon: Icon, label, value, iconCls }) {
  return (
    <div
      className={`bg-surface-container rounded-xl border border-surface-container-border px-4 py-3 shadow-[0_1px_4px_rgba(0,47,167,0.05)] ${Icon ? "flex items-center justify-between" : ""}`}
    >
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-[13px] font-semibold text-black">{value}</p>
      </div>
      {Icon && (
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}
        >
          <Icon size={14} />
        </div>
      )}
    </div>
  );
}
