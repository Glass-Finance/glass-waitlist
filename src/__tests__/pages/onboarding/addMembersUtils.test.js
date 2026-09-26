import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ALLOWED_ROLE_NAMES,
  FALLBACK_ROLES,
  COMPLETED_STEP_IDS,
  HEADERS,
  SAMPLE_ROW,
  downloadTemplate,
  parseCsvText,
  parseCsvFile,
  parseCsvFromUrl,
  csvRowToMember,
} from "../../../pages/onboarding/addMembersUtils";

describe("csv constants", () => {
  it("exposes the template headers and sample row", () => {
    expect(HEADERS).toEqual([
      "First Name",
      "Last Name",
      "Email Address",
      "Phone Number",
      "Member ID",
      "Role/Title",
    ]);
    expect(SAMPLE_ROW).toHaveLength(6);
  });

  it("exposes the role allowlist, fallback role, and completed steps", () => {
    expect(ALLOWED_ROLE_NAMES.has("Community Member")).toBe(true);
    expect(FALLBACK_ROLES).toEqual([{ id: "", name: "Community Member" }]);
    expect(COMPLETED_STEP_IDS).toContain("payment");
  });
});

describe("parseCsvText", () => {
  it("parses header-keyed rows and skips empty lines", () => {
    const rows = parseCsvText(
      "First Name,Last Name,Email Address\nAda,Okafor,ada@example.com\n\nChidi,Eze,chidi@example.com\n",
    );
    expect(rows).toEqual([
      { "First Name": "Ada", "Last Name": "Okafor", "Email Address": "ada@example.com" },
      { "First Name": "Chidi", "Last Name": "Eze", "Email Address": "chidi@example.com" },
    ]);
  });

  it("returns an empty array for header-only input", () => {
    expect(parseCsvText("First Name,Email Address\n")).toEqual([]);
  });
});

describe("parseCsvFile", () => {
  it("reads text off the file object and parses it", async () => {
    const file = { text: async () => "Email Address\nada@example.com\n" };
    await expect(parseCsvFile(file)).resolves.toEqual([{ "Email Address": "ada@example.com" }]);
  });
});

describe("parseCsvFromUrl", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("fetches the URL and parses the body", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      text: async () => "Email Address\nada@example.com\n",
    }));
    await expect(parseCsvFromUrl("https://example.com/members.csv")).resolves.toEqual([
      { "Email Address": "ada@example.com" },
    ]);
  });

  it("throws on a non-ok response", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false }));
    await expect(parseCsvFromUrl("https://example.com/missing.csv")).rejects.toThrow(
      "Couldn't download a file from that URL.",
    );
  });
});

describe("csvRowToMember", () => {
  const roles = [
    { id: "r-owner", name: "Community Owner" },
    { id: "r-member", name: "Community Member" },
  ];

  it("reads the email across header variants and matches roles case-insensitively", () => {
    expect(
      csvRowToMember({ Email: "ada@example.com", Role: "community member" }, roles, "r-x"),
    ).toEqual({ email: "ada@example.com", roleId: "r-member" });
    expect(csvRowToMember({ email: "  ada@example.com  " }, roles, "r-x")).toEqual({
      email: "ada@example.com",
      roleId: "r-x",
    });
  });

  it("falls back to the default role when the label matches nothing", () => {
    expect(
      csvRowToMember(
        { "Email Address": "ada@example.com", "Role/Title": "Janitor" },
        roles,
        "r-member",
      ),
    ).toEqual({
      email: "ada@example.com",
      roleId: "r-member",
    });
  });

  it("returns an empty email when no header variant is present", () => {
    expect(csvRowToMember({ "First Name": "Ada" }, roles, "r-member")).toEqual({
      email: "",
      roleId: "r-member",
    });
  });
});

describe("downloadTemplate", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:template");
    URL.revokeObjectURL = vi.fn();
  });

  it("triggers a download of the template CSV", () => {
    const click = vi.fn();
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
      const el = createElement(tag, options);
      if (tag === "a") el.click = click;
      return el;
    });

    downloadTemplate();

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:template");
    document.createElement.mockRestore();
  });
});
