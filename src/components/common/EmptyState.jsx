// Standardized "this list/section has nothing in it yet" state — an icon,
// a clear title, an optional explanatory subtitle, and an optional CTA.
// Replaces the plain one-line gray text ("No X yet.") that used to appear
// inconsistently (no icon, no context, no next step) across the app.
//
// `illustration` (an image src) and `illustrationNode` (an arbitrary React
// node, for illustrations composed of multiple layered pieces) are both
// alternatives to `icon` for the bigger, page-level empty states — existing
// `icon`-based call sites are unaffected.
export default function EmptyState({ icon: Icon, illustration, illustrationNode, title, subtitle, action, actionLabel, className = "" }) {
  return (
    <div className={`flex flex-col items-center text-center py-10 px-6 ${className}`}>
      {illustrationNode && <div className="mb-4">{illustrationNode}</div>}
      {!illustrationNode && illustration && (
        <img src={illustration} alt="" className="w-[180px] h-auto mb-4" draggable={false} />
      )}
      {!illustrationNode && !illustration && Icon && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-brand-tint"
        >
          <Icon size={20} className="text-brand" />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1 max-w-xs">{subtitle}</p>}
      {action && (
        <button
          onClick={action}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-all border-none cursor-pointer inline-flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
