// ---------------------------------------------------------------------------
// Shared primitives — light sheet style (matches Figma)
// ---------------------------------------------------------------------------
export function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-label font-medium mb-1.5 text-[#111]"
    >
      {children}
    </label>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p
      className="text-xs mt-1.5 px-1 text-[#E53E3E]"
      role="alert"
    >
      {message}
    </p>
  );
}
