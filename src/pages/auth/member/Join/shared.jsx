// ---------------------------------------------------------------------------
// Shared primitives — light sheet style (matches Figma)
// ---------------------------------------------------------------------------
export function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-label font-medium mb-1.5 text-ink">
      {children}
    </label>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs mt-1.5 px-1 text-danger" role="alert">
      {message}
    </p>
  );
}
