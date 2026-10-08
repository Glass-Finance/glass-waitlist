import ProfileAvatar from "../memberApp/ProfileAvatar";
import { GlyphCheckMark, GlyphLock } from "./illustrations";
import { GLASS_PASS_UNLOCKS } from "./unlocks";
import { toPascalCaseName } from "../../utils/format";

// The Glass Pass rail — the wizard's left column on sm+ and a single compact
// card above the wizard on phones (the modal becomes a bottom sheet there, so
// there is no room for a side rail).
//
// Both variants come from this one component so the pass can never disagree
// with itself between breakpoints. Deliberately NOT a credential: it shows
// the member's own name and photo, and the count of capabilities that
// verification switches on — nothing machine-readable, nothing the backend
// trusts.
//
// Name and photo are render-only. AuthContext deliberately keeps names out of
// product analytics (PII minimisation), and this must not become a path back
// to that: nothing here is reported anywhere.
export default function GlassPassRail({ user, pass, variant = "full" }) {
  if (variant === "compact") {
    return (
      <div
        aria-label="Your Glass Pass"
        className="sm:hidden mb-3 rounded-2xl bg-gradient-to-br from-[var(--color-brand-deep)] to-[var(--color-brand)] px-3 py-2.5 text-white"
      >
        <div className="flex items-center gap-2.5">
          <ProfileAvatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold m-0 truncate">{displayName(user)}</p>
            <p className="text-[10.5px] opacity-80 m-0 leading-tight">
              {pass.unlockedCount} of {GLASS_PASS_UNLOCKS.length} features unlocked
            </p>
          </div>
          <span
            className={[
              "text-[10px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0",
              pass.unlocked ? "bg-white text-success-deep" : "bg-white/20 text-white",
            ].join(" ")}
          >
            {pass.chip}
          </span>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Your Glass Pass"
      className="hidden sm:flex flex-col gap-5 w-[248px] flex-shrink-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-deep)] to-[var(--color-brand)] px-4 py-5 text-white"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.09em] opacity-70 m-0">Your Glass Pass</p>

        <div className="relative overflow-hidden rounded-2xl bg-white/12 border border-white/20 px-3.5 py-3 mt-2.5">
          {/* Identity row — the signed-in member, not the attempt. */}
          <div className="flex items-center gap-2.5">
            <ProfileAvatar user={user} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold m-0 leading-tight truncate">
                {displayName(user)}
              </p>
              <p className="text-[10.5px] opacity-75 m-0 leading-tight">{pass.subLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3.5">
            <span
              className="text-[9.5px] font-bold tracking-[0.11em] opacity-90"
              aria-hidden="true"
            >
              GLASS
            </span>
            <span className="text-[11.5px] font-semibold">Glass Pass</span>
            <span
              className={[
                "ml-auto text-[10px] font-semibold px-2 py-[3px] rounded-full",
                pass.unlocked ? "bg-white text-success-deep" : "bg-white/20 text-white",
              ].join(" ")}
            >
              {pass.chip}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/15">
            <span className="text-[10px] opacity-80">ID · {pass.idLabel}</span>
            <span className="text-[10px] opacity-80">
              {pass.unlockedCount} of {GLASS_PASS_UNLOCKS.length} features unlocked
            </span>
          </div>

          {!pass.unlocked && (
            <span className="absolute top-3 right-3 text-white/70" aria-hidden="true">
              <GlyphLock size={14} />
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.09em] opacity-70 m-0">
          Unlocks when verified
        </p>
        <ul className="flex flex-col gap-2 list-none p-0 m-0 mt-2.5">
          {GLASS_PASS_UNLOCKS.map(({ id, Glyph, text }) => (
            <li key={id} className="flex items-center gap-2.5">
              <span className="w-[26px] h-[26px] rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Glyph size={15} />
              </span>
              <span className="text-[11.5px] leading-tight flex-1 min-w-0">{text}</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                {pass.unlocked ? (
                  <span className="w-[15px] h-[15px] rounded-full bg-white text-success-deep flex items-center justify-center">
                    <GlyphCheckMark size={9} />
                  </span>
                ) : (
                  <GlyphLock size={13} className="opacity-60" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] leading-[1.5] opacity-75 m-0 mt-auto">
        Verification runs through Smile ID, our identity partner. Glass never sees your ID number or
        photo.
      </p>
    </aside>
  );
}

// First name is what the rest of the app shows; fall back through the pair and
// finally to the email local-part so the rail is never blank mid-hydration.
// Pascal-cased: the backend sends whatever the member typed at registration, so
// an all-lowercase "cynthia ee" was rendering verbatim in the identity card.
function displayName(user) {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  if (full) return toPascalCaseName(full);
  const emailName = user?.email?.split("@")[0];
  return toPascalCaseName(emailName) || "Glass member";
}
