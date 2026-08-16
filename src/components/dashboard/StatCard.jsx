// Shared stat tile used across dashboard list pages (Payments, Members,
// MemberDetail). icon/iconCls are optional — MemberDetail's usage omits
// the icon block entirely. Sized to match the Dashboard page's own stat
// card (min-h-128px, p-5, label pinned to the top and icon+value pinned
// to the bottom via flex-col justify-between) so the two don't drift
// apart in height/proportions again.
export default function StatCard({ icon: Icon, label, value, iconCls }) {
  return (
    <div className="min-h-[128px] flex flex-col justify-between bg-surface-container rounded-lg border border-surface-container-border p-5">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}
          >
            <Icon size={16} />
          </div>
        )}
        <span className="text-2xl font-bold text-black">{value}</span>
      </div>
    </div>
  );
}
