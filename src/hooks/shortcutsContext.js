import { createContext } from "react";

// Split into its own file (rather than living in useKeyboardShortcuts.js or
// KeyboardShortcutsProvider.jsx) purely so neither of those files mixes a
// non-component export with their component/hook exports -- that mix is
// what breaks Vite's fast-refresh (react-refresh/only-export-components).
export const ShortcutsContext = createContext(null);
