import { useState } from "react";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    q: "How does Glass collect payments automatically?",
    a: "Members securely link their cards once, and dues are deducted based on the schedule you set — monthly, yearly, or custom.",
  },
  {
    q: "What happens if a payment fails?",
    a: "Glass automatically retries the payment and sends a gentle SMS/WhatsApp reminder to the member. Your treasurer is notified immediately so nothing slips through the cracks.",
  },
  {
    q: "Can members see all transactions?",
    a: "Yes. Every member has access to a transparent ledger showing all income and expenditure for the organisation. Admins can control visibility settings per category.",
  },
  {
    q: "Is Glass secure?",
    a: "Absolutely. Glass uses bank-grade AES-256 encryption, is fully NDPR compliant, and partners with NDIC-insured banks. We never have direct access to your funds — every transaction requires proper authorisation.",
  },
  {
    q: "Can we customize our dues structure?",
    a: "Yes. You can create multiple due types (monthly, annual, one-time levies), set different amounts per member tier, and configure custom payment schedules to match your organisation's rules.",
  },
];

export default function WhyGlass() {
  const [open, setOpen] = useState(0);

  return (
    <section className="relative bg-[#F7F8FC] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1140px] mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-6">
            FAQ
          </span>
          <h2 className="text-[clamp(32px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[16px] text-[#9099b2] max-w-[640px] mx-auto leading-relaxed">
            Everything you need to know about using Glass, from setting up
            dues to tracking payments and ensuring full transparency.
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-[860px] mx-auto mb-14">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className={`bg-[#F0F2F8] rounded-2xl mb-3 overflow-hidden border transition-all duration-300 ${
                open === i ? "border-[#e0e4f5]" : "border-transparent"
              }`}
            >
              <button
                className="w-full flex items-center gap-4 px-6 py-5 text-left bg-transparent border-none cursor-pointer"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div
                  className={`flex-shrink-0 w-1 rounded-full self-stretch transition-all duration-300 ${
                    open === i ? "bg-[#1C2B8A]" : "bg-transparent"
                  }`}
                />
                <span
                  className={`flex-1 font-bold text-[16px] leading-snug transition-colors duration-200 ${
                    open === i ? "text-[#1C2B8A]" : "text-[#0f1d6e]"
                  }`}
                >
                  {faq.q}
                </span>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-[18px] leading-none transition-all duration-300 ${
                    open === i
                      ? "bg-[#1C2B8A] border-[#1C2B8A] text-white"
                      : "border-[#d1d5e0] text-[#9099b2]"
                  }`}
                >
                  {open === i ? "−" : "+"}
                </div>
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: open === i ? "200px" : "0px" }}
              >
                <p className="text-[15px] text-[#9099b2] leading-relaxed pl-11 pr-14 pb-6">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="/contact"
            className="inline-flex items-center gap-2.5 bg-[#0f1d6e] hover:bg-[#1C2B8A] text-white font-semibold text-[15px] px-7 py-3.5 rounded-full no-underline transition-all hover:-translate-y-0.5 shadow-lg shadow-[#0f1d6e]/25"
          >
            Ask A Question
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}