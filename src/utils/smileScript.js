// Loads the Smile ID inline web SDK on demand. External <script src> only —
// no inline script (keeps CSP hash rules in vercel.json happy). Deduped via a
// module-level promise so concurrent callers share one injection.

const SCRIPT_SRC = "https://cdn.usesmileid.com/inline/v12/js/script.min.js";

/** @type {Promise<void> | null} */
let loadPromise = null;

function getSmile() {
  return /** @type {any} */ (window).SmileIdentity;
}

/**
 * @returns {Promise<void>}
 */
export function loadSmileScript() {
  if (typeof window !== "undefined" && typeof getSmile() === "function") {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (typeof getSmile() === "function") {
        resolve(undefined);
        return;
      }
      existing.addEventListener("load", () => resolve(undefined), { once: true });
      existing.addEventListener(
        "error",
        () => {
          loadPromise = null;
          reject(new Error("Failed to load Smile ID SDK"));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(undefined);
    script.onerror = () => {
      loadPromise = null;
      script.remove();
      reject(new Error("Failed to load Smile ID SDK"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
