import ModalShell from "./ModalShell";
import { useShortcutsHelp } from "../../hooks/useKeyboardShortcuts";

// Fixed, not pulled from the registry -- every modal in the app registers
// its own internal Escape binding (description: null, see useEscapeToClose)
// so it doesn't show up 17 times here; these two are the one copy of that
// story worth telling.
const GENERAL = [
  { keys: "Esc", description: "Close the open dialog" },
  { keys: "?", description: "Toggle this shortcuts list" },
];

function Keycap({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md border border-gray-300 bg-gray-50 text-[11px] font-semibold text-gray-700 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }) {
  const parts = keys.split(" ");
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-gray-600">{description}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {parts.map((k, i) => (
          <Keycap key={i}>{k}</Keycap>
        ))}
      </div>
    </div>
  );
}

function Group({ title, items }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <ShortcutRow key={item.keys + item.description} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function KeyboardShortcutsHelp() {
  const { open, setOpen, registry } = useShortcutsHelp();

  if (!open) return null;

  // Registered entries with no description (every modal's own internal
  // Escape binding) are deliberately excluded -- GENERAL above covers Esc
  // once for the whole app instead of once per open modal.
  const described = registry.filter((e) => e.description);
  const byGroup = (group) => described.filter((e) => e.group === group);

  return (
    <ModalShell title="Keyboard Shortcuts" onClose={() => setOpen(false)}>
      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
        <Group title="General" items={GENERAL} />
        <Group title="Navigation" items={byGroup("Navigation")} />
        <Group title="Platform Admin" items={byGroup("Platform Admin")} />
      </div>
    </ModalShell>
  );
}
