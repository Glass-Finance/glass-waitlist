import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CommunitiesSection from "../../../../pages/dashboard/platform-admin/CommunitiesSection";
import { getAdminCommunities, setCommissionOverride } from "../../../../api/admin";
import { updateCommunitySettings } from "../../../../api/communities";

// Platform-admin community controls: the commission-override payload
// (basis points + minor-unit cap vs explicit nulls for platform default)
// and the joining/visibility settings payload are the two mutations this
// section owns — both asserted against the real modal wiring.

vi.mock("../../../../api/admin", async (importOriginal) => ({
  ...(await importOriginal()),
  getAdminCommunities: vi.fn(),
  setCommissionOverride: vi.fn(),
}));
vi.mock("../../../../api/communities", async (importOriginal) => ({
  ...(await importOriginal()),
  updateCommunitySettings: vi.fn(),
}));

function page(content) {
  return { data: { data: { content, totalElements: content.length, totalPages: 1 } } };
}

const community = {
  id: "comm-1",
  slug: "kca",
  name: "KCA Alumni",
  status: "ACTIVE",
  commissionRate: 0,
  commissionCapMinor: 0,
  createdAt: "2026-01-15T00:00:00.000Z",
  metrics: { totalMembers: 120 },
  requiresMemberApproval: false,
  publicVisible: false,
  logo: null,
};

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CommunitiesSection />
    </QueryClientProvider>,
  );
}

async function findRow() {
  const name = await screen.findByText("KCA Alumni");
  return name.closest("tr");
}

function submitOpenModal() {
  const save = screen.getByRole("button", { name: "Save" });
  fireEvent.submit(save.closest("form"));
}

beforeEach(() => {
  getAdminCommunities.mockResolvedValue(page([community]));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CommunitiesSection — rendering", () => {
  it("renders a community row with default-commission and member count", async () => {
    renderSection();
    const row = await findRow();

    expect(row.textContent).toContain("kca");
    expect(row.textContent).toContain("Platform default");
    expect(row.textContent).toContain("120");
    expect(row.textContent).toContain("ACTIVE");
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Commission" })).toBeTruthy();
  });
});

describe("CommunitiesSection — commission override", () => {
  it("sends explicit nulls when the platform default rate is kept", async () => {
    setCommissionOverride.mockResolvedValue({});
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: "Commission" }));

    expect(screen.getByText("Commission Override")).toBeTruthy();
    expect(screen.getByLabelText("Use platform default rate").checked).toBe(true);
    submitOpenModal();

    await waitFor(() =>
      expect(setCommissionOverride).toHaveBeenCalledWith("kca", {
        rate: null,
        capMinor: null,
      }),
    );
    await waitFor(() => expect(screen.queryByText("Commission Override")).toBeNull());
  });

  it("converts a custom rate and naira cap to the wire format", async () => {
    setCommissionOverride.mockResolvedValue({});
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: "Commission" }));

    fireEvent.click(screen.getByLabelText("Use platform default rate"));
    fireEvent.change(screen.getByPlaceholderText("e.g. 150 for 1.5%"), {
      target: { value: "150" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 500"), { target: { value: "500" } });
    submitOpenModal();

    await waitFor(() =>
      expect(setCommissionOverride).toHaveBeenCalledWith("kca", {
        rate: 150,
        capMinor: 50000,
      }),
    );
  });

  it("cancels without saving", async () => {
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: "Commission" }));

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Commission Override")).toBeNull();
    expect(setCommissionOverride).not.toHaveBeenCalled();
  });
});

describe("CommunitiesSection — joining & visibility settings", () => {
  it("saves both toggles with the expected payload", async () => {
    updateCommunitySettings.mockResolvedValue({});
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: "Settings" }));

    expect(screen.getByText("Joining & Visibility")).toBeTruthy();
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);
    expect(switches[0].getAttribute("aria-checked")).toBe("false");
    expect(switches[1].getAttribute("aria-checked")).toBe("false");

    fireEvent.click(switches[1]); // Show in Discover
    expect(switches[1].getAttribute("aria-checked")).toBe("true");
    expect(switches[0].getAttribute("aria-checked")).toBe("false");

    submitOpenModal();

    await waitFor(() =>
      expect(updateCommunitySettings).toHaveBeenCalledWith("kca", {
        requiresMemberApproval: false,
        publicVisible: true,
      }),
    );
    await waitFor(() => expect(screen.queryByText("Joining & Visibility")).toBeNull());
  });

  it("keeps the modal open when saving settings fails", async () => {
    updateCommunitySettings.mockRejectedValue({
      response: { status: 400, data: { message: "bad payload" } },
    });
    renderSection();
    fireEvent.click(await screen.findByRole("button", { name: "Settings" }));

    submitOpenModal();

    await waitFor(() => expect(updateCommunitySettings).toHaveBeenCalled());
    expect(screen.getByText("Joining & Visibility")).toBeTruthy();
  });
});
