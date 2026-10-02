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
      {photoUrl ? <PulseImg src={photoUrl} alt="" className="w-full h-full" /> : getInitials(user)}
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
