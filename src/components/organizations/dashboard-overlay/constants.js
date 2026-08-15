export const TOASTS = [
  {
    color: "#059669",
    title: "Payment received",
    sub: "Joseph Alabi paid ₦20,200",
  },
  {
    color: "#002FA7",
    title: "New member joined",
    sub: "Grace Adekunle joined the community",
  },
  {
    color: "#d4a017",
    title: "Reminder sent",
    sub: "SMS sent to 12 overdue members",
  },
  {
    color: "#7c3aed",
    title: "Plan milestone",
    sub: "Infra Development: 74% collected",
  },
  {
    color: "#059669",
    title: "Payment received",
    sub: "Emeka Nwosu paid ₦15,000",
  },
];

export const ELEM_IDS = [
  "e0",
  "e1",
  "e2",
  "e3",
  "e4",
  "e5",
  "e6",
  "e7",
  "e8",
  "e9",
  "e10",
  "e11",
];

export const PBARS = [
  { id: "pb0", w: "60%" },
  { id: "pb1", w: "74%" },
];

// Sidebar nav-item click targets, in the mockup's 960px natural space —
// where the guided-tour cursor lands before each screen switch.
export const NAV_POINTS = {
  dashboard: { x: 138, y: 94 },
  payments: { x: 138, y: 129 },
  members: { x: 138, y: 164 },
};

// DashboardOverlay's internals are all fixed-pixel (rendered at this
// natural width, fixed sidebar/grid widths) — retrofitting every value to
// be fluid would mean rebuilding it. ScaledDashboard renders it at this
// size and scales the whole thing down (via CSS transform, so every text/
// icon/spacing value shrinks together) to fit whatever width it's given.
// Deliberately wider than the Hero's own ~960px column: at 1080 the demo
// renders ~11% smaller than its natural size, reading calmer/less "zoomed
// in" than a literal 1:1 scale (was 960, the case that showed everything
// at full size).
export const DASHBOARD_NATURAL_WIDTH = 1080;
