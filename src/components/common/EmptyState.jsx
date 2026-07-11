// Standardized "this list/section has nothing in it yet" state — an icon,
// a clear title, an optional explanatory subtitle, and an optional CTA.
// Replaces the plain one-line gray text ("No X yet.") that used to appear
// inconsistently (no icon, no context, no next step) across the app.
export default function EmptyState({ icon: Icon, title, subtitle, action, actionLabel, className = "" }) {
  return (
    <div className={`flex flex-col items-center text-center py-10 px-6 ${className}`}>
      {Icon && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ background: "#E6EEFF" }}
        >
          <Icon size={20} style={{ color: "#002FA7" }} />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1 max-w-xs">{subtitle}</p>}
      {action && (
        <button
          onClick={action}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
