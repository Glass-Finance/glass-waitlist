import { Search, Bell } from "lucide-react";

export default function Topbar({ searchPlaceholder = "Search members, payments, receipts..." }) {
  return (
    <header className="h-14 bg-white border-b border-[#EFEFF1] flex items-center gap-4 px-6 sticky top-0 z-50 flex-shrink-0">

      {/* Search */}
      <div className="flex-1 max-w-[420px] flex items-center gap-2 bg-[#FFFFFF] rounded-md px-3 py-2 border border-gray-100 focus-within:ring-1 focus-within:ring-[#002FA7]">
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">

        {/* Bell */}
        <button className="relative bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700 transition-colors p-0">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#eef0f8]" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C2B8A] to-[#4f46e5] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            AA
          </div>
          <div>
            <p className="text-xs font-bold text-[#0f1d6e] leading-tight">Amina Agrawal</p>
            <p className="text-[11px] text-gray-400">amina@gmail.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
