// Live-updating status lines for the verification flow (brief item 3) —
// module constants so StatusNarrative's cycling interval isn't reset every
// render. Kept out of the component file so the fast-refresh
// only-export-components rule stays happy (StatusStep imports these too).
export const KYC_NARRATIVE_LINES = {
  launching: ["Opening the secure capture window…"],
  capturing: [
    "Complete the check in the Smile ID window…",
    "Keep your ID within reach — this usually takes about two minutes…",
  ],
  processing: ["Uploading…", "Checking document quality…", "Verifying with issuer…"],
};

// The four things that actually happen, as a checklist the user can watch
// advance. Kept separate from the rotating lines above: these are stable
// labels (they must not flicker), while the lines are ambient reassurance.
// {id} interpolates the chosen ID type.
export const KYC_TIMELINE_STEPS = [
  { key: "open", label: "Open Smile ID" },
  { key: "capture", label: "Enter your {id} and take a selfie" },
  { key: "match", label: "Match against your {id} record" },
  { key: "result", label: "Get your result" },
];
