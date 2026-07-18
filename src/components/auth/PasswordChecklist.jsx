import { Check, X } from "lucide-react";
import { getPasswordChecks } from "../../utils/password";

// Live-updating password requirements list — shown as soon as the user
// starts typing rather than only after a failed submit. Each requirement
// ticks green the moment it's satisfied.
export default function PasswordChecklist({ password }) {
  const checks = getPasswordChecks(password);

  return (
    <ul className="mt-1.5 px-0.5 flex flex-col gap-1.5">
      {checks.map(({ key, label, met }) => (
        <li
          key={key}
          className="flex items-center gap-2 text-xs text-gray-600 transition-colors"
        >
          {met ? (
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-brand"
            >
              <Check size={10} className="text-white" strokeWidth={3} />
            </span>
          ) : (
            <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-300">
              <X size={10} className="text-gray-400" strokeWidth={2.5} />
            </span>
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}
