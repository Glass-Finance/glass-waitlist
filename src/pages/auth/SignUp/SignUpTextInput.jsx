import { forwardRef } from "react";
import { TextInput } from "../../../components/ui/TextInput";

// Thin wrapper around the shared TextInput (components/ui/TextInput.jsx)
// for the SignUp step flow (EmailPhoneStep, RegisterStep) -- keeps this
// flow's own brand-blue accent (variant="signup") while inheriting the same
// height/radius/border/padding every other input in the app now shares.
// The accent used to be spelled #2535c3, a banned value that
// components/ui/Button.jsx names as the exact bug the shared components
// were written to prevent; it is now the --color-brand token.
export const SignUpTextInput = forwardRef(function SignUpTextInput(props, ref) {
  return <TextInput ref={ref} variant="signup" {...props} />;
});

export function SignUpFieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1 px-0.5 text-danger" role="alert">
      {message}
    </p>
  );
}
