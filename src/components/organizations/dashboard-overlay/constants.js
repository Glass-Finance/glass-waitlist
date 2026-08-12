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

// DashboardOverlay's internals are all fixed-pixel (960px-wide layout,
// fixed sidebar/grid widths) — retrofitting every value to be fluid would
// mean rebuilding it. ScaledDashboard renders it at this natural size and
// scales the whole thing down to fit whatever width it's given instead.
export const DASHBOARD_NATURAL_WIDTH = 960;
