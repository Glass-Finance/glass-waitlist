// The Glass Pass — shared state + copy for the wizard's left rail and the
// success card. Lives in its own module (not a component) so both surfaces
// read one derivation and the fast-refresh only-export-components rule stays
// happy.
//
// What the pass is: a compact statement of *who you are* and *what
// verification unlocks*. It is not a credential — nothing here is
// machine-readable, and the three rows are product capabilities, not ID
// checks. The count is deliberately all-or-nothing: verification is a single
// gate, so it is never partially earned.
import { GlyphCommunity, GlyphPlans, GlyphPayout } from "./illustrations";

export const GLASS_PASS_UNLOCKS = [
  { id: "communities", Glyph: GlyphCommunity, text: "Create & manage communities" },
  { id: "plans", Glyph: GlyphPlans, text: "Set up payment plans" },
  { id: "payouts", Glyph: GlyphPayout, text: "Receive contributions & payouts" },
];

// Chip label per pass state. Deliberately coarse: the rail is ambient, the
// StatusStep card is where the precise server status is explained.
export const GLASS_PASS_CHIP = {
  idle: "Locked",
  launching: "Verifying",
  capturing: "Verifying",
  processing: "Verifying",
  review: "In review",
  verified: "Verified",
  failed: "Not verified",
  paused: "Paused",
  resume: "Unfinished",
};

/**
 * Collapse the KYC state machine into the rail's single ambient state.
 *
 * @param {object} input
 * @param {boolean} input.isApproved - APPROVED; the only state that unlocks.
 * @param {boolean} input.isInReview
 * @param {boolean} input.isPaused - admin paused new attempts.
 * @param {boolean} input.isTerminal - rejected / error / expired / revoked.
 * @param {boolean} input.showResume - an INITIATED attempt can be re-opened.
 * @param {boolean} input.busy - capture starting or in the Smile ID window.
 * @param {boolean} input.inFlight
 * @param {boolean} input.startPending
 * @param {string} input.idLabel - e.g. "BVN" / "NIN", shown on the pass card.
 */
export function deriveGlassPassState({
  isApproved,
  isInReview,
  isPaused,
  isTerminal,
  showResume,
  busy,
  inFlight,
  startPending,
  idLabel,
}) {
  let phase = "idle";
  if (isApproved) phase = "verified";
  else if (isPaused) phase = "paused";
  else if (showResume) phase = "resume";
  else if (isInReview) phase = "review";
  else if (isTerminal) phase = "failed";
  else if (startPending) phase = "launching";
  else if (busy) phase = "capturing";
  else if (inFlight) phase = "processing";

  return {
    phase,
    chip: GLASS_PASS_CHIP[phase],
    // All-or-nothing by design — see the module comment.
    unlockedCount: isApproved ? GLASS_PASS_UNLOCKS.length : 0,
    // The pass answers "are you verified?" without borrowing status jargon.
    subLabel: isApproved ? "Identity confirmed" : "Glass member",
    idLabel: idLabel || "ID",
    unlocked: isApproved,
  };
}
