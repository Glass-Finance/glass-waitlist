// src/components/memberApp/ProfileAvatar.jsx
//
// The signed-in member's photo for the member app header, sized to sit
// flush beside the 38px notification-bell button. Falls back to their
// initials on the brand gradient when they haven't uploaded a photo (or
// while GET /user/me is still hydrating), matching the dashboard
// Topbar's account avatar so the two shells can't drift.
//
// `profileImage.url` is attacker-influenced (it comes straight off the
// /user/me payload), but AuthContext normalises it through
// `normalizeProfileImage` before it lands on `user`, and PulseImg
// re-validates the scheme at the sink — belt and braces, same as
// Topbar.

import PulseImg from "../common/PulseImg";
import { getInitials } from "../../utils/getInitials";

/**
 * @param {object} props
 * @param {object} props.user - AuthContext user (needs `profileImage.url`, `firstName`, `lastName`, `email`)
 * @param {() => void} [props.onClick] - navigate target, e.g. to /member/profile
 * @param {string} [props.className] - extra classes on the button
 * @param {string} [props.ariaLabel]
 */
export default function ProfileAvatar({ user, onClick, className = "", ariaLabel = "Profile" }) {
  const photoUrl = user?.profileImage?.url ?? null;

  const avatar = (
    <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[var(--color-brand)] to-accent-indigo flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 select-none overflow-hidden">
      {/* Pass the initials as PulseImg's fallback rather than only choosing
          between image and initials here: with the URL present but the
          request failing (signed URL expired, storage migration, deleted
          object) the old ternary rendered an <img> that stayed at opacity-0,
          i.e. a bare gradient circle with no photo and no initials. */}
      <PulseImg
        src={photoUrl}
        alt=""
        className="w-full h-full"
        fallback={<span>{getInitials(user)}</span>}
      />
    </div>
  );

  if (!onClick) return avatar;

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`bg-transparent border-none p-0 cursor-pointer flex-shrink-0 transition-opacity hover:opacity-80 ${className}`}
    >
      {avatar}
    </button>
  );
}
