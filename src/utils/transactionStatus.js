const STATUS_STYLES = {
  Success: {
    cls: "bg-success-tint text-success-deep",
    dotCls: "bg-success-deep",
    text: "Successful",
  },
  Failed: { cls: "bg-danger-wash text-danger", dotCls: "bg-danger", text: "Failed" },
  Pending: { cls: "bg-[#fef9c3] text-warning", dotCls: "bg-warning", text: "Pending" },
};

export function transactionStatusLabel(status) {
  if (status === "success" || status === "successful") return "Success";
  if (status === "failed") return "Failed";
  return "Pending";
}

export function transactionStatusStyle(status) {
  const label = transactionStatusLabel(status);
  return { label, ...STATUS_STYLES[label] };
}
