import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

// A searchable bank picker — a plain native <select> is unusable once the
// bank list runs into the hundreds, so this swaps in a filterable dropdown
// with the same trigger-button footprint as the <select> it replaces.
// `onChange` is called with the full { code, name } bank object.
export default function BankSelect({ banks, value, onChange, placeholder = "Choose Bank", triggerClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  const selected = banks.find((b) => b.code === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer ${triggerClassName}`}
      >
        <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[240px] bg-white rounded-xl border border-gray-100 shadow-lg z-30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search banks..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-3 text-center">No banks match "{query}"</p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => {
                    onChange(b);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs border-none cursor-pointer transition-colors ${
                    b.code === value ? "bg-blue-50 font-medium text-[#002FA7]" : "bg-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {b.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
