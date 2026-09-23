import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PhoneOTPStep from "../../../../pages/auth/SignUp/PhoneOTPStep";
import { requestPhoneOtp, verifyPhoneOtp } from "../../../../services/authService";

// Registration-time phone verification: this step only VERIFIES (the send
// happens one level up — see PhoneOTPStep.jsx's header comment) and returns
// the confirmToken register() needs. Uncovered off the baseline; services
// mocked at the module boundary per repo convention.
vi.mock("../../../../services/authService", () => ({
  requestPhoneOtp: vi.fn(),
  verifyPhoneOtp: vi.fn(),
}));

const PHONE = "+2348012345678";

function renderStep() {
  const onVerified = vi.fn();
  const onBack = vi.fn();
  render(<PhoneOTPStep phone={PHONE} onVerified={onVerified} onBack={onBack} />);
  return { onVerified, onBack };
}

function typeCode(code) {
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: code } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Continue|Verifying/ }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PhoneOTPStep continue button", () => {
  it("stays disabled until all six digits are entered", () => {
    renderStep();

    expect(screen.getByRole("button", { name: "Continue" }).disabled).toBe(true);

    typeCode("123");
    expect(screen.getByRole("button", { name: "Continue" }).disabled).toBe(true);

    typeCode("123456");
    expect(screen.getByRole("button", { name: "Continue" }).disabled).toBe(false);
  });
});

describe("PhoneOTPStep verification", () => {
  it("verifies the code for the exact number and passes the confirmToken up", async () => {
    const { onVerified } = renderStep();
    verifyPhoneOtp.mockResolvedValue({ confirmToken: "pct-9" });

    typeCode("123456");
    submit();

    await waitFor(() => expect(onVerified).toHaveBeenCalledWith("pct-9"));
    expect(verifyPhoneOtp).toHaveBeenCalledWith({ phoneNumber: PHONE, otp: "123456" });
  });

  it("explains a rejected code inline and does not advance", async () => {
    const { onVerified } = renderStep();
    verifyPhoneOtp.mockRejectedValue({
      response: { status: 400, data: { message: "OTP verification failed" } },
    });

    typeCode("654321");
    submit();

    expect(await screen.findByText("OTP verification failed")).toBeDefined();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("re-requests a code for the same number on resend and clears the entered code", async () => {
    renderStep();
    requestPhoneOtp.mockResolvedValue({});

    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(await screen.findByText("A new code has been sent.")).toBeDefined();
    expect(requestPhoneOtp).toHaveBeenCalledWith({ phoneNumber: PHONE });
    expect(screen.getByLabelText("Verification code").value).toBe("");
  });

  it("returns to the previous step on 'Wrong number?'", () => {
    const { onBack } = renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Wrong number?" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
