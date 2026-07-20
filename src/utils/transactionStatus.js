const STATUS_STYLES = {
  Success: { cls: "bg-success-tint text-[#15803d]", dotCls: "bg-[#15803d]", text: "Successful" },
  Failed: { cls: "bg-[#fce4e4] text-danger", dotCls: "bg-danger", text: "Failed" },
  Pending: { cls: "bg-[#fef9c3] text-[#b45309]", dotCls: "bg-[#b45309]", text: "Pending" },
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
