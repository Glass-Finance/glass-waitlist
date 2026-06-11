import { Bell, ChevronDown, Clock3, Filter, Menu } from "lucide-react";

export default function MembersDashboardOverlay() {
  return (
    <div
      className="w-full h-full bg-[#f5f5f5] overflow-hidden"
      style={{
        top: "6.2%",
        left: "21.2%",
        width: "70%",
        height: "100%",
        borderRadius: "42px",
        transform: `perspective(1200px) rotateZ(18deg) rotateY(16deg)`,
        transformOrigin: "right",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: "scale(0.48)",
          transformOrigin: "top left",
          background: "#f5f5f5",
        }}
      >
        {/* HEADER */}

        <div className="px-4 pt-10 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Menu size={28} />

              <div className="w-6 h-6 rounded bg-white border flex items-center justify-center">
                <span className="text-[8px]">🏫</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[18px] font-medium">
                  Kings College Community
                </span>

                <ChevronDown size={18} />
              </div>
            </div>

            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
              <Bell size={18} />
            </div>
          </div>

          <h2 className="mt-8 text-[22px] font-semibold">Hi David,</h2>

          <p className="text-[14px] text-gray-500">
            Here's Your Community At A Glance
          </p>
        </div>

        {/* MAIN CARD */}

        <div className="mx-4 mt-8 rounded-xl bg-white p-4 shadow-sm w-full">
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full text-[14px] bg-blue-100 text-blue-700">
              Recurring
            </span>
          </div>

          <p className="text-center text-gray-400 mt-4">Next Payment Due</p>

          <h1 className="text-center text-[28px] font-light leading-none mt-1">
            ₦15,000
          </h1>

          <div className="flex justify-center mt-4">
            <span className="bg-purple-100 px-3 py-1 rounded text-[16px]">
              Ikoyi Club
            </span>
          </div>

          <div className="flex justify-center items-center gap-1 text-gray-400 mt-4">
            <Clock3 size={14} />
            <span>Due June 1, 2025.</span>
          </div>

          <button className="w-full bg-[#0f37bf] text-white py-4 rounded mt-6">
            Pay Now
          </button>
        </div>

        {/* UPCOMING */}

        <div className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[16px]">Upcoming Payments</span>

            <div className="flex items-center gap-1 text-[#0f37bf]">
              <span>Filter</span>
              <Filter size={14} />
            </div>
          </div>

          {[
            {
              amount: "₦2,500",
              title: "Annual Hackathon Fee",
              tag: "Recurring",
            },
            {
              amount: "₦8,500",
              title: "Rotary Club Of Lagos",
              tag: "One-time",
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#fafafa] rounded-xl p-3 mb-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold text-[18px]">
                    {item.amount}
                    <span className="font-normal text-gray-500">
                      {item.amount === "₦2,500" ? "/month" : ""}
                    </span>
                  </div>

                  <div className="mt-1">{item.title}</div>

                  <div className="text-gray-400 text-sm mt-1">
                    Due: Jun 15, 2025
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                    {item.tag}
                  </span>

                  <button className="border border-[#0f37bf] text-[#0f37bf] px-4 py-1 rounded">
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center text-[#0f37bf] font-medium mt-3">
            View All
          </div>
        </div>

        {/* HISTORY */}

        <div className="mx-4 mt-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex justify-between">
            <span className="text-[16px]">Payment History</span>

            <span className="text-[#0f37bf]">See All</span>
          </div>

          {[
            ["Success", "#c8f7cb"],
            ["Failed", "#ffd0d0"],
            ["Success", "#c8f7cb"],
          ].map(([status, bg], index) => (
            <div
              key={index}
              className="flex justify-between py-5 border-b border-gray-100"
            >
              <div>
                <div>Membership</div>

                <div className="text-gray-500 text-sm">May 1, 2026</div>
              </div>

              <div className="text-right">
                <div className="font-medium">₦24,000</div>

                <span
                  style={{ background: bg }}
                  className="inline-block mt-2 px-3 py-1 rounded text-sm"
                >
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
