// Matches the backend's actual rule (confirmed from a real 400 response off
// POST /auth/register): min 8 chars, at least one uppercase, one lowercase,
// one digit, one special character. Shared by every registration form so
// this surfaces immediately client-side instead of after a round-trip to
// the server.
export function isPasswordValid(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export const PASSWORD_REQUIREMENTS_TEXT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a digit, and a special character.";
