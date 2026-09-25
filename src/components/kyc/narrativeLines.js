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
