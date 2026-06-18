import { useState } from "react";
import { CreditCard, Trash2 } from "lucide-react";

export default function PaymentMethod() {
  const [cards, setCards] = useState([
    { id: 1, type: "Visa",       last4: "4521", expiry: "09/27", isDefault: true  },
    { id: 2, type: "Mastercard", last4: "4521", expiry: "09/27", isDefault: false },
  ]);

  const setDefault = (id) =>
    setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));

  const removeCard = (id) =>
    setCards(cards.filter(c => c.id !== id));

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">
      <div>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Payment methods</p>
        <p className="text-xs text-gray-500 mb-5">Saved cards and bank accounts</p>

        {/* Saved cards */}
        <div className="bg-gray-50 rounded-xl p-5 mb-4" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-sm font-medium text-gray-900 mb-0.5">Saved cards</p>
          <p className="text-xs text-gray-500 mb-4">
            Cards used for your personal dues payments across all communities.
          </p>

          <div className="flex flex-col gap-3">
            {cards.map(card => (
              <div
                key={card.id}
                className="flex items-center justify-between  px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EEF2FF" }}
                  >
                    <CreditCard size={16} className="text-[#002FA7]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      {card.type} ●●●● {card.last4}
                    </p>
                    <p className="text-xs text-gray-500">Expires {card.expiry}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {card.isDefault ? (
                    <span
                      className="text-xs text-[#002FA7] font-medium px-3 py-1 rounded-xl"
                      style={{ background: "#D7E2FF", border: "1px solid #C7D2FE" }}
                    >
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefault(card.id)}
                      className="text-xs text-[#002FA7] font-medium hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => removeCard(card.id)}
                    className="text-red-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Payment Method */}
          <div className="flex justify-end mt-4">
            <button
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-small rounded-sm text-[#002FA7] bg-white hover:bg-blue-50 transition-all cursor-pointer"
              style={{ border: "1px solid #002FA7" }}
            >
              + Add Payment Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}