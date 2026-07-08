import { Check, X } from "lucide-react";
import { getPasswordChecks } from "../../utils/password";

// Live-updating password requirements list — shown as soon as the user
// starts typing rather than only after a failed submit. Each requirement
// ticks green the moment it's satisfied.
export default function PasswordChecklist({ password }) {
  const checks = getPasswordChecks(password);

  return (
    <ul className="mt-1.5 px-0.5 flex flex-col gap-1">
      {checks.map(({ key, label, met }) => (
        <li
          key={key}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            met ? "text-green-600" : "text-gray-400"
          }`}
        >
          {met ? (
            <Check size={12} className="flex-shrink-0" />
          ) : (
            <X size={12} className="flex-shrink-0" />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}
