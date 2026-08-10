import arcImg from "../../../../assets/dashboard/empty-states/arc.png";
import documentImg from "../../../../assets/dashboard/empty-states/payment-plan-illustration.png";
import peopleImg from "../../../../assets/dashboard/empty-states/people-icon.png";
import cardImg from "../../../../assets/dashboard/empty-states/card-icon.png";
import houseImg from "../../../../assets/dashboard/empty-states/house-icon.png";

// The Payments empty-state illustration is 5 separate exported layers (dashed
// arc + center document + 3 satellite icons), not one flat image -- composed
// here with absolute positioning rather than flattened, so each piece stays
// crisp at any display size.
export default function PaymentPlanIllustration({ className = "" }) {
  return (
    <div className={`relative ${className}`} style={{ width: 300, height: 260 }}>
      <img src={arcImg} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: 58, width: 300, transform: "translateX(-50%)" }} />
      <img src={peopleImg} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: 38, width: 38, transform: "translateX(-50%)" }} />
      <img src={documentImg} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: 66, width: 200, transform: "translateX(-50%)" }} />
      <img src={cardImg} alt="" draggable={false} style={{ position: "absolute", left: 12, top: 168, width: 38 }} />
      <img src={houseImg} alt="" draggable={false} style={{ position: "absolute", right: 12, top: 160, width: 38 }} />
    </div>
  );
}
