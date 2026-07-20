import { useState } from "react";
import { Download } from "lucide-react";
import ReceiptModal from "../common/ReceiptModal";

export default function ReceiptDownloadButton({
  tx,
  payerName,
  payerEmail,
  disabled,
  title,
  buttonClassName = "",
  buttonStyle,
  iconSize = 13,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title={title}
        className={buttonClassName}
        style={buttonStyle}
      >
        <Download size={iconSize} />
      </button>

      {open && (
        <ReceiptModal
          tx={tx}
          payerName={payerName}
          payerEmail={payerEmail}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
