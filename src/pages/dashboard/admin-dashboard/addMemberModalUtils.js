import Papa from "papaparse";

export const ALLOWED_ROLE_NAMES = new Set([
  "Community Member",
  "Community Admin",
  "Community Manager",
]);

export const FALLBACK_ROLES = [{ id: "member", name: "Community Member" }];

export const CSV_TEMPLATE =
  "First Name,Last Name,Email Address,Phone Number,Member ID,Role/Title\nMuhammed,Dorachinma,Muhammed@example.com,0812990293,A23434,Student";

export function parseMemberCSV(text) {
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  const get = (row, ...keys) => {
    for (const key of keys) {
      const value = row[key];
      if (value != null && String(value).trim() !== "")
        return String(value).trim();
    }
    return "";
  };

  return data
    .map((row) => ({
      firstName: get(row, "First Name", "firstName"),
      lastName: get(row, "Last Name", "lastName"),
      email: get(row, "Email Address", "Email", "email"),
      phone: get(row, "Phone Number", "Phone", "phone"),
      memberId: get(row, "Member ID", "memberId"),
      role: get(row, "Role/Title", "Role", "Title", "role"),
    }))
    .filter((row) => row.email);
}
