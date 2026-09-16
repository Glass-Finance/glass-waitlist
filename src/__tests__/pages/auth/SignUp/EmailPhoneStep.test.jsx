import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EmailPhoneStep from "../../../../pages/auth/SignUp/EmailPhoneStep";

// Avoids depending on Google's Identity Services script/API in a jsdom
// test -- this file's own submit behavior is what's under test here, not
// GoogleAuthButton's.
vi.mock("../../../../components/auth/GoogleAuthButton", () => ({
  default: () => <div data-testid="google-auth-button" />,
}));

function renderStep() {
  const onNext = vi.fn();
  render(
    <MemoryRouter>
      <EmailPhoneStep onNext={onNext} onSwitch={vi.fn()} onGoogleAuth={vi.fn()} />
    </MemoryRouter>,
  );
  return onNext;
}

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText("Enter Your Email Address"), {
    target: { value: "sulaimon@example.com" },
  });
}

describe("EmailPhoneStep's Continue button", () => {
  it("submits the email-only form on click", async () => {
    const onNext = renderStep();

    fillValidForm();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Continue"));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        email: "sulaimon@example.com",
        phone: "",
      }),
    );
  });

  it("shows an error and does not call onNext when clicked without accepting the terms", () => {
    const onNext = renderStep();

    fillValidForm();
    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByText("Please Accept Our Terms to Continue")).toBeDefined();
    expect(onNext).not.toHaveBeenCalled();
  });
});
