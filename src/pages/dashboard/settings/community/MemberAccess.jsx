import { useState } from "react";
import { Copy, Check } from "lucide-react";

const MOCK_MEMBERS = [
  { name: "Adebayo Okafor", email: "adebayo@email.com", role: "Admin"  },
  { name: "Adebayo Okafor", email: "adebayo@email.com", role: "Admin"  },
  { name: "Adebayo Okafor", email: "adebayo@email.com", role: "Member" },
  { name: "Adebayo Okafor", email: "adebayo@email.com", role: "Member" },
];

const INVITE_LINK = "glass.app/join/KCL-2024-X9";

export default function MemberAccess() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${INVITE_LINK}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl w-full">

      {/* Invite Link */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Invite Link</p>
        <p className="text-xs text-gray-500 mb-4">
          Share this link with members so they can join your community on Glass.
        </p>
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}
        >
          <span className="text-sm text-gray-700 font-medium">{INVITE_LINK}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer flex-shrink-0"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Admin management</p>
        <p className="text-xs text-gray-500 mb-4">Promote members to admin or revoke admin access.</p>

        <div className="flex flex-col">
          {MOCK_MEMBERS.map((member, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < MOCK_MEMBERS.length - 1 ? "1px solid #F3F4F6" : "none" }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    color:      member.role === "Admin" ? "#002FA7" : "#D97706",
                    background: member.role === "Admin" ? "#EEF2FF" : "#FEF3C7",
                  }}
                >
                  {member.role}
                </span>
              </div>
              <button
                className="text-sm font-semibold hover:opacity-70 transition-all bg-transparent border-none cursor-pointer"
                style={{ color: member.role === "Admin" ? "#EF4444" : "#EF4444" }}
              >
                {member.role === "Admin" ? "Revoke" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}