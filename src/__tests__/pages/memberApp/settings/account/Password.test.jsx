import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Password from "../../../../../pages/memberApp/settings/account/Password";
import { useUpdatePassword } from "../../../../../hooks/useMyAccount";

vi.mock("../../../../../hooks/useMyAccount", () => ({ useUpdatePassword: vi.fn() }));

vi.mock("../../../../../components/memberApp/GlassLogoGlow", () => ({ default: () => null }));

function renderPassword() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Password />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillPasswordFields(container, [current, next, confirm]) {
  // PasswordField labels are unassociated display labels, so target the
  // three password inputs in render order: current, new, confirm.
  const inputs = container.querySelectorAll('input[type="password"]');
  expect(inputs).toHaveLength(3);
  const values = [current, next, confirm];
  inputs.forEach((input, i) => fireEvent.change(input, { target: { value: values[i] } }));
}

describe("member Password update payload", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    mutateAsync.mockReset().mockResolvedValue({});
    useUpdatePassword.mockReturnValue({ mutateAsync, isPending: false });
  });

  it("sends exactly { oldPassword, newPassword, confirmPassword } per PATCH /user/password", async () => {
    const { container } = renderPassword();

    fillPasswordFields(container, ["OldPass123!", "NewPass123!", "NewPass123!"]);
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith({
      oldPassword: "OldPass123!",
      newPassword: "NewPass123!",
      confirmPassword: "NewPass123!",
    });
  });

  it("does not call the API when the confirmation does not match", async () => {
    const { container } = renderPassword();

    fillPasswordFields(container, ["OldPass123!", "NewPass123!", "Different123!"]);
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    expect(screen.getByText("New passwords don't match.")).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
