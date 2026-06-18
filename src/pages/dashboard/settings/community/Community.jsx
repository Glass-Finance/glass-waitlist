import { useState } from "react";

const CATEGORIES = [
  "Alumni Association",
  "Faith Community",
  "Professional Association",
  "Student Club",
  "University Club",
  "NGO / Non-profit",
  "Sports Club",
  "School",
  "Other",
];

const inputCls =
  "w-full border border-gray-300 px-3 py-2.5 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

export default function Community() {
  const [form, setForm] = useState({
    name: "Kings College Lagos",
    category: "School",
    description: "Old boys association of Kings College Lagos, Nigeria.",
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4" >

      {/* ── Profile ── */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Profile</p>
        <p className="text-xs text-gray-500 mb-3">Manage your personal information</p>

        <div
          className="bg-[#f6f6f8] rounded-lg px-4 py-4 flex items-center justify-between"
          style={{ border: "1px solid #EFEFF1" }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-[#002FA7] flex-shrink-0"
              style={{ background: "#D7E2FF" }}
            >
              A.A
            </div>
            <div>
              <p className="text-sm text-gray-900">Kings College Lagos</p>
              <p className="text-xs text-gray-500">aminaagrawal@gmail.com</p>
            </div>
          </div>
          <button
            className="px-3 py-2 rounded-sm text-xs b text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
            style={{ border: "1px solid" }}
          >
            Change Logo
          </button>
        </div>
      </div>

      {/* ── Community Information ── */}
      <div
        className="bg-[#f6f6f8] rounded-lg px-5 pt-4 pb-5"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Community Information</p>
        <p className="text-xs text-gray-500 mb-4">This is how your information will appear across glass</p>

        <div className="flex flex-col gap-3">
          {/* Community Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Community Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            className="px-2 py-2 rounded-sm text-xs text-[#002FA7] hover:bg-[#002FA7]/10 transition-all border border-[#002FA7] cursor-pointer"
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Delete Account ── */}
      <div
        className="bg-[#f6f6f8] rounded-lg px-5 pt-4 pb-4"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <p className="text-sm text-gray-900 mb-0.5">Delete Account</p>
        <p className="text-xs text-gray-500 mb-3">Permanent actions that cannot be undone.</p>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ border: "1px solid #FECACA", background: "#FFF5F5" }}
        >
          <p className="text-xs text-gray-700">
            Permanently remove your account and all associated data from Glass.
          </p>
          <button
            className="ml-4 px-3 py-1.5 rounded-md text-xs text-red-600 bg-white hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Auto-Pay info banner ── */}
      <div
        className="flex items-start gap-2 px-4 py-3 text-xs text-gray-600 rounded-md"
        style={{ background: "#EEF2FF", border: "1px solid #002fec" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="1.8" />
          <path d="M12 8v4m0 4h.01" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>
          Auto-Pay charges your default card on the due date. You'll receive a notification 3 days before each charge.
        </span>
      </div>

    </div>
  );
}