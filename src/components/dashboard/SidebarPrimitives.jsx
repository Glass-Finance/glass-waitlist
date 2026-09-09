import { LogOut } from "lucide-react";

export function MobileOverlay({ mobileOpen, onClose }) {
  if (!mobileOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[55] md:hidden"
      onClick={onClose}
    />
  );
}

export function SidebarLogo({ onClick, title }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 p-0 bg-transparent border-none cursor-pointer"
      title={title}
    >
      <img
        src="/glass-logo-silver.webp"
        alt="Glass"
        className="w-8 h-8 object-contain block"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          if (event.currentTarget.nextSibling) {
            event.currentTarget.nextSibling.style.display = "flex";
          }
        }}
      />
      <div
        className="hidden w-8 h-8 rounded-md bg-white/25 items-center justify-center text-white font-black text-base"
        aria-hidden="true"
      >
        G
      </div>
    </button>
  );
}

export function LogoutButton({ onClick, loggingOut }) {
  return (
    <button
      onClick={onClick}
      disabled={loggingOut}
      title="Log out"
      className="w-9 h-9 rounded-xl border-none cursor-pointer flex items-center justify-center bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-50"
    >
      <LogOut size={14} />
    </button>
  );
}

export function UserIdentity({ user, initials, displayName }) {
  return (
    <div className="py-2.5 px-3 border-t border-[var(--color-hairline)] flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,var(--color-brand),#4f46e5)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
        {user?.profileImage?.url ? (
          <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold m-0 whitespace-nowrap overflow-hidden text-ellipsis">
          {displayName}
        </p>
      </div>
    </div>
  );
}
