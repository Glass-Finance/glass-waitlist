import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const BANK_CODE_SLUG = {
  "044": "access-bank", "063": "access-bank",
  "050": "ecobank-nigeria", "011": "first-bank-of-nigeria",
  "214": "first-city-monument-bank", "070": "fidelity-bank",
  "058": "guaranty-trust-bank", "030": "heritage-bank",
  "301": "jaiz-bank", "082": "keystone-bank",
  "076": "polaris-bank", "101": "providus-bank",
  "221": "stanbic-ibtc-bank", "068": "standard-chartered-bank",
  "232": "sterling-bank", "032": "union-bank-of-nigeria",
  "033": "united-bank-for-africa", "215": "unity-bank",
  "035": "wema-bank", "057": "zenith-bank",
  "023": "citibank-nigeria", "526": "parallex-bank",
};

function getBankLogoUrl(bank) {
  if (bank.logo) return bank.logo;
  const slug = bank.slug ?? BANK_CODE_SLUG[bank.code];
  return slug ? `https://paystack.com/banks/${slug}.png` : null;
}

function BankLogo({ bank, size = 20 }) {
  const [failed, setFailed] = useState(false);
  const url = getBankLogoUrl(bank);
  if (!url || failed) return null;
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className="rounded flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

// A searchable bank picker — a plain native <select> is unusable once the
// bank list runs into the hundreds, so this swaps in a filterable dropdown
// with the same trigger-button footprint as the <select> it replaces.
// `onChange` is called with the full { code, name, slug?, logo? } bank object.
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
        <span className="flex items-center gap-2 min-w-0">
          {selected && <BankLogo bank={selected} size={18} />}
          <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
            {selected ? selected.name : placeholder}
          </span>
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
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-2 text-xs border-none cursor-pointer transition-colors ${
                    b.code === value ? "bg-blue-50 font-medium text-[#002FA7]" : "bg-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <BankLogo bank={b} size={18} />
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
