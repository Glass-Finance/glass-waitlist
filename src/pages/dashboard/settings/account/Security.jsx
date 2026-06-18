import { useState } from "react";
import { Eye, EyeOff, Monitor, Smartphone } from "lucide-react";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
    >
      <div
        className={`relative w-8 h-[20px] rounded-full transition-all duration-300 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}
      >
        <div
          className={`absolute top-0.75 w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[16px]" : "left-0.5"}`}
        />
      </div>
      <span className={`text-xs font-medium ${on ? "text-gray-600" : "text-gray-400"}`}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

export default function Security() {
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [twoFA, setTwoFA] = useState({ enable: true, sms: true });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const toggle2FA = (key) => setTwoFA((t) => ({ ...t, [key]: !t[key] }));

  const inputCls = "w-full px-4 py-2.5 rounded-md border border-gray-300 text-gray-900 text-xs outline-none transition-all pr-11";

  const sessions = [
    { icon: <Monitor size={16} />, label: "MacBook Pro · Chrome", sub: "Lagos, Nigeria · Active now", active: true },
    { icon: <Smartphone size={16} />, label: "SMS verification", sub: "Send OTP to phone number", active: false },
  ];

  return (
    <div className="max-w-2xl flex flex-col gap-5">

      {/* Password */}
      <div className="bg-[#f6f6f6] rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Password</p>
        <p className="text-xs text-gray-500 mb-5">Keep your account secure with a strong password.</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Current Password</label>
            <div className="relative">
              <input
                type={show.current ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="Enter Current Password"
                className={inputCls}
              />
              <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">New Password</label>
              <div className="relative">
                <input
                  type={show.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter New Password"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
              <div className="relative">
                <input
                  type={show.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm New Password"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-4 py-2 rounded-sm font-small text-xs  text-[#002FA7] border border-[#002FA7] hover:opacity-90 transition-all">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-[#f6f6f6] rounded-2xl p-6" style={{ border: "1px solid #f6f6f6" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Two-factor authentication</p>
        <p className="text-xs text-gray-500 mb-5">Add an extra layer of protection to your account.</p>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm text-gray-900">Enable 2FA</p>
            <p className="text-xs text-gray-500">Require a verification code on every login</p>
          </div>
          <Toggle on={twoFA.enable} onChange={() => toggle2FA("enable")} />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm  text-gray-900">SMS verification</p>
            <p className="text-xs text-gray-500">Send OTP to phone number</p>
          </div>
          <Toggle on={twoFA.sms} onChange={() => toggle2FA("sms")} />
        </div>
      </div>

      {/* Active sessions */}
      <div className="bg-[#f6f6f6] rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Active sessions</p>
        <p className="text-xs text-gray-500 mb-5">Devices currently logged into your Glass account.</p>

        {sessions.map((s, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
            </div>
            <button className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}