import { useEffect } from "react";
import { X } from "lucide-react";

// Shared dashboard modal chrome — extracted out of AdminPanel.jsx so other
// dashboard pages (Members, MemberDetail, MemberAccess, Payments, finance
// settings) can build confirm dialogs on the same visual language instead
// of falling back to window.confirm().
export default function ModalShell({ title, subtitle, onClose, children }) {
  // Escape-to-close -- every dashboard modal built on this shell gets this
  // for free; hand-rolled modals elsewhere in the app don't have it yet.
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-surface-container-border"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
