import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EmailPhoneStep from "../../../../pages/auth/SignUp/EmailPhoneStep";
import { requestPhoneOtp } from "../../../../services/authService";

vi.mock("../../../../services/authService", () => ({
  requestPhoneOtp: vi.fn(),
}));

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
  fireEvent.change(screen.getByPlaceholderText("Enter Your Phone Number"), {
    target: { value: "08031234567" },
  });
}

beforeEach(() => {
  requestPhoneOtp.mockReset();
});

// Regression: the shared Button component defaults to type="button" --
// unlike the plain <button> this form used to render, which got
// type="submit" for free from the browser just by sitting inside a <form>
// with no type attribute at all. Swapping in the shared Button without an
// explicit type="submit" silently broke this: clicking Continue stopped
// firing the form's onSubmit entirely, so nothing happened at all.
describe("EmailPhoneStep's Continue button", () => {
  it("submits the form on click and calls onNext once the phone OTP request succeeds", async () => {
    requestPhoneOtp.mockResolvedValue({});
    const onNext = renderStep();

    fillValidForm();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Continue"));

    await waitFor(() =>
      expect(onNext).toHaveBeenCalledWith({
        email: "sulaimon@example.com",
        phone: "08031234567",
      }),
    );
    expect(requestPhoneOtp).toHaveBeenCalledWith({ phoneNumber: "08031234567" });
  });

  it("shows an error and does not call onNext when clicked without accepting the terms", () => {
    const onNext = renderStep();

    fillValidForm();
    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByText("Please Accept Our Terms to Continue")).toBeDefined();
    expect(onNext).not.toHaveBeenCalled();
    expect(requestPhoneOtp).not.toHaveBeenCalled();
  });
});
