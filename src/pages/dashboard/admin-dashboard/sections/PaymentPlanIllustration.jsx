import documentImg from "../../../../assets/dashboard/empty-states/payment-plan-illustration.png";

export default function PaymentPlanIllustration({ className = "" }) {
  return (
    <div className={`relative ${className}`} style={{ width: 300, height: 260 }}>
      <img src={documentImg} alt="" draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: 260, transform: "translate(-50%, -50%)" }} />
    </div>
  );
}
