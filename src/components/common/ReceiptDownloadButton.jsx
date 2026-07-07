import { useEffect, useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon } from "lucide-react";

// Icon-button trigger + a small "PDF or Image" menu, used anywhere a
// generated receipt can be downloaded (member's own transactions, an
// admin's view of a member's payment history). The actual PDF/image
// generators are lazy-loaded on choice, not on render.
export default function ReceiptDownloadButton({
  tx,
  payerName,
  disabled,
  title,
  buttonClassName = "",
  buttonStyle,
  iconSize = 13,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleChoice(format) {
    setOpen(false);
    const { downloadReceiptPdf, downloadReceiptImage } = await import("../../utils/generateReceipt");
    if (format === "pdf") downloadReceiptPdf(tx, { payerName });
    else downloadReceiptImage(tx, { payerName });
  }

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={title}
        className={buttonClassName}
        style={buttonStyle}
      >
        <Download size={iconSize} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-lg border border-gray-100 shadow-lg z-30 overflow-hidden min-w-[170px]">
          <button
            type="button"
            onClick={() => handleChoice("pdf")}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-none bg-transparent cursor-pointer text-left"
          >
            <FileText size={13} className="text-gray-400 flex-shrink-0" /> Download as PDF
          </button>
          <button
            type="button"
            onClick={() => handleChoice("image")}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-none bg-transparent cursor-pointer text-left"
          >
            <ImageIcon size={13} className="text-gray-400 flex-shrink-0" /> Download as Image
          </button>
        </div>
      )}
    </div>
  );
}
