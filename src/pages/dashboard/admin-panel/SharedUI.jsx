import { useRef } from "react";
import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getErrorMessage } from "../../../utils/errorHandler";
import EmptyState from "../../../components/common/EmptyState";
import LoadingState from "../../../components/common/LoadingState";
import { STATUS_COLORS } from "./shared";

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
  };
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text} whitespace-nowrap`}
    >
      {(status ?? "—").replace(/_/g, " ")}
    </span>
  );
}

export function PagerBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer bg-white text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-default border border-surface-container-border"
    >
      {children}
    </button>
  );
}

export function Pager({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => Math.abs(i - page) <= 2,
  );
  return (
    <div className="flex items-center gap-1">
      <PagerBtn onClick={() => onPage(page - 1)} disabled={page === 0}>
        <ChevronLeft size={13} />
      </PagerBtn>
      {pages.map((i) => (
        <button
          key={i}
          onClick={() => onPage(i)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
            i === page
              ? "bg-brand text-white border-none"
              : "bg-white text-gray-500 hover:bg-gray-100 border border-surface-container-border"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <PagerBtn
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
      >
        <ChevronRight size={13} />
      </PagerBtn>
    </div>
  );
}

export function TableShell({ isLoading, isEmpty, error, emptyIcon, emptyLabel = "No results found", children }) {
  const is403 = error?.response?.status === 403;
  return (
    <div
      className="bg-surface-container rounded-2xl overflow-hidden border border-surface-container-border"
    >
      {isLoading ? (
        <LoadingState className="py-16" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-xs font-semibold text-red-500">
            {is403 ? "Access denied" : "Failed to load"}
          </p>
          <p className="text-xs text-gray-400">
            {is403
              ? "Platform admin rights required to view this data."
              : getErrorMessage(error)}
          </p>
        </div>
      ) : isEmpty ? (
        <EmptyState icon={emptyIcon} title={emptyLabel} className="py-16" />
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

export function SectionHeader({ title, desc, count, isFetching, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
          {count > 0 && (
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {count.toLocaleString()}
            </span>
          )}
          {isFetching && (
            <RefreshCw size={12} className="text-gray-300 animate-spin" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      {right && (
        <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
      )}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search…", width = 200 }) {
  return (
    <div className="relative">
      <Search
        size={12}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-4 py-2 rounded-lg text-xs text-gray-700 placeholder-gray-400 outline-none border border-[#D0D0D0] bg-white focus:border-brand"
        style={{ width }}
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg text-xs text-gray-700 outline-none cursor-pointer border border-[#D0D0D0] bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function useDebounce(setter, delay = 350) {
  const ref = useRef(null);
  return (val) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setter(val), delay);
  };
}

export function TableFooter({ totalElements, noun, page, totalPages, onPage }) {
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-[11px] text-gray-400">
        {totalElements.toLocaleString()} {noun}
        {totalElements !== 1 ? "s" : ""}
      </p>
      <Pager page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}
