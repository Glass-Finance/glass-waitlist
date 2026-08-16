// Shared stat tile used across dashboard list pages (Payments, Members,
// MemberDetail). icon/iconCls are optional — MemberDetail's usage omits
// the icon block entirely. Sized to match the Dashboard page's own stat
// card (min-h-108px on desktop, p-4, label pinned to the top and
// icon+value pinned to the bottom via flex-col justify-between) so the
// two don't drift apart in height/proportions again. Taller on mobile
// (min-h-[132px]) -- the grid collapses to one full-width column below
// md, and the same 108px reads as a flat, short strip once the card is
// that wide; a taller mobile-only height keeps the proportions sane
// without changing anything on desktop.
export default function StatCard({ icon: Icon, label, value, iconCls }) {
  return (
    <div className="min-h-[132px] md:min-h-[108px] flex flex-col justify-between bg-surface-container rounded-lg border border-surface-container-border p-4">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}
          >
            <Icon size={15} />
          </div>
        )}
        <span className="text-xl font-bold text-black">{value}</span>
      </div>
    </div>
  );
}
