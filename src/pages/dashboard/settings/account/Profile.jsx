import { useState } from "react";

export default function Profile() {
  const [form, setForm] = useState({
    firstName: "Amina",
    lastName: "Argawal",
    email: "aminaargawal@gmail.com",
    phone: "+234 902 293 2425",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const inputCls =
    "w-full px-4 py-2.5 rounded-lg bg-white text-gray-900 text-xs outline-none transition-all border border-gray-300 focus:border-[#002FA7]";

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">

      {/* Profile card */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Profile</p>
        <p className="text-xs text-gray-500">Manage your personal information</p>
      </div>
      <div className="bg-white rounded-lg p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#D7E2FF] flex items-center justify-center flex-shrink-0">
              <span className="text-sm text-[#002FA7]">A.A</span>
            </div>
            <div>
              <p className="text-sm text-gray-900">Amina Argawal</p>
              <p className="text-xs text-gray-500">aminaargawal@gmail.com</p>
            </div>
          </div>
          <button
            className="px-2 py-2 rounded-sm text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer"
            style={{ border: "1px solid" }}
          >
            Change Photo
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Personal Information</p>
        <p className="text-xs text-gray-500 mb-5">This is how your information will appear across glass</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">First Name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Last Name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Email Address</label>
            <input name="email" value={form.email} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="p-2 rounded-sm text-[11px] text-[#002FA7] hover:bg-[#002FA7] hover:text-white transition-all cursor-pointer border border-[#002FA7]"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Delete Account</p>
        <p className="text-xs text-gray-500 mb-4">Permanent actions that cannot be undone.</p>
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ border: "1px solid #FECACA", background: "#FFF5F5" }}
        >
          <p className="text-xs text-gray-700">
            Permanently remove your account and all associated data from Glass.
          </p>
          <button
            className="ml-4 px-4 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer bg-transparent"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}