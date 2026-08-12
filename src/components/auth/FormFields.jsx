import { Button } from "../ui/Button";
import { TextInput } from "../ui/TextInput";

// Shared input primitives for the unified auth pages (SignIn,
// ForgotPassword, ResetPassword) — used identically inside AuthLayout's
// desktop and mobile chrome, since the form itself doesn't need to change
// shape between them, only the shell around it does.

export function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-label font-medium mb-1.5 text-[#111]">
      {children}
    </label>
  );
}

// Re-exported under this name so SignIn/ForgotPassword/ResetPassword don't
// need their import paths touched -- the actual implementation lives in
// components/ui/TextInput.jsx, the one shared text input for the whole app.
export { TextInput };

// Re-exported under this name so SignIn/ForgotPassword/ResetPassword don't
// need their import paths touched -- the actual implementation lives in
// components/ui/Button.jsx, the one shared primary CTA for the whole app.
export const PrimaryButton = Button;

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1.5 px-1 text-danger" role="alert">
      {message}
    </p>
  );
}
