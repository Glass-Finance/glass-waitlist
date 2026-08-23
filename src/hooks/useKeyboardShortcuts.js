import { useContext, useEffect, useRef } from "react";
import { ShortcutsContext } from "./shortcutsContext";

export function useShortcutsHelp() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcutsHelp must be used within KeyboardShortcutsProvider");
  return { open: ctx.helpOpen, setOpen: ctx.setHelpOpen, registry: ctx.registry };
}

// `keys` — "Escape", "?", a single character ("1".."9"), or a chord string
// "g h". `description`/`group` are omitted (null) for internal-only
// bindings (e.g. a single modal's own Escape-to-close) that shouldn't
// clutter the help overlay.
export function useRegisterShortcut(keys, description, handler, { group = "General", enabled = true } = {}) {
  // Depending on the whole context object (not just `register`) here would
  // be a real infinite loop, not just a wasted render: `registry`/`helpOpen`
  // change on every registration, which changes the context's value object,
  // which every consumer re-reads via useContext -- if this effect depended
  // on that whole object, registering once would re-trigger itself on the
  // very re-render its own registration causes, forever. `register` itself
  // is useCallback([])-stable, so depending on only that breaks the cycle.
  const register = useContext(ShortcutsContext)?.register;
  const handlerRef = useRef(handler);
  // Refs can't be written during render (breaks under concurrent rendering)
  // -- updating it in its own effect, right after render commits, instead.
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!register || !enabled || !keys) return undefined;
    const entry = { keys, description, group, handler: (e) => handlerRef.current(e) };
    return register(entry);
  }, [register, keys, description, group, enabled]);
}

// Same as useRegisterShortcut, but for a whole list at once (e.g. Sidebar's
// handful of "go to X" bindings) -- calling useRegisterShortcut itself in a
// .map() would call a hook from inside a loop, which React disallows even
// when the list's length happens to be constant. `bindings` is
// [{ keys, description, handler }], re-registered whenever the list
// reference changes (callers should useMemo it if it's built fresh from
// render-time values, same as any other effect dependency).
export function useRegisterShortcutGroup(bindings, group = "General") {
  // See useRegisterShortcut above -- depending on `register` alone (stable),
  // not the whole context object, is what keeps this from looping.
  const register = useContext(ShortcutsContext)?.register;
  useEffect(() => {
    if (!register) return undefined;
    const unregisters = bindings.map((b) =>
      register({ keys: b.keys, description: b.description, group, handler: b.handler }),
    );
    return () => unregisters.forEach((un) => un());
  }, [register, bindings, group]);
}

// Drop-in replacement for the "close this modal on Escape" useEffect that
// used to be hand-rolled (window/document addEventListener + cleanup) in
// every modal separately. `active` lets a conditionally-rendered modal
// (e.g. one gated behind `deleteModal &&`) only claim Escape while it's
// actually open, same as before.
export function useEscapeToClose(onClose, active = true) {
  useRegisterShortcut("Escape", null, onClose, { enabled: active });
}
