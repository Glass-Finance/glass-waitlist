import Papa from "papaparse";

export const ALLOWED_ROLE_NAMES = new Set([
  "Community Owner",
  "Community Admin",
  "Community Member",
]);

export const FALLBACK_ROLES = [{ id: "", name: "Community Member" }];
export const COMPLETED_STEP_IDS = ["choose-path", "paying-member", "organization", "payment"];
export const HEADERS = [
  "First Name",
  "Last Name",
  "Email Address",
  "Phone Number",
  "Member ID",
  "Role/Title",
];
export const SAMPLE_ROW = [
  "Muhammed",
  "Dorachinma",
  "Muha***med@**.com",
  "0812990293",
  "A23434",
  "Student",
];

export function downloadTemplate() {
  const sample = ["Ada", "Okafor", "ada@example.com", "08031234567", "M001", "Member"];
  const csv = `${HEADERS.join(",")}\n${sample.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "glass-member-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function parseCsvText(text) {
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

export async function parseCsvFile(file) {
  return parseCsvText(await file.text());
}

export async function parseCsvFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Couldn't download a file from that URL.");
  return parseCsvText(await response.text());
}

export function csvRowToMember(row, roles, defaultRoleId) {
  const get = (...keys) => {
    for (const key of keys) {
      const value = row[key];
      if (value != null && String(value).trim() !== "") return String(value).trim();
    }
    return "";
  };
  const roleLabel = get("Role/Title", "Role", "Title", "role");
  const matchedRole = roles?.find(
    (role) => role.name?.toLowerCase() === roleLabel.toLowerCase(),
  );

  return {
    email: get("Email Address", "Email", "email"),
    roleId: matchedRole?.id ?? defaultRoleId,
  };
}
