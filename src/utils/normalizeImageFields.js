// src/utils/normalizeImageFields.js
//
// Thin, shape-preserving wrappers around safeImageUrl() for the two server image
// shapes the API returns: a bare `{ url }` object (community logos, a user's
// profileImage) and a plain URL string.
//
// These are NOT a second sanitizer — every scheme decision still lives in
// safeImageUrl.js, which remains the single place that policy is defined. What
// lives here is only the plumbing: read `.url`, validate, write it back, and
// leave every other field on the object exactly as the backend sent it.
//
// Why they exist: the audit found ~16 image sinks that all reduce to a handful of
// data boundaries, so validation belongs at those boundaries (AuthContext,
// the community hooks, the transaction shapers) rather than at each JSX sink.
// Repeating `safeImageUrl(x.logo?.url)` inline at ~20 call sites would spread
// the policy and let a new sink quietly skip it.

import { safeImageUrl } from "./safeImageUrl";

/**
 * Normalize a `{ url, ... }` image object.
 *
 * Returns the value unchanged when there is nothing to do (absent, or already a
 * safe URL), so React Query's structural sharing does not see a new object on
 * every refetch and consumers relying on identity keep it.
 *
 * @template {{ url?: unknown }} T
 * @param {T | null | undefined} image
 * @returns {T | null | undefined} same shape; `url` is null when rejected
 */
export function normalizeImageObject(image) {
  if (!image || typeof image !== "object") return image;
  const url = safeImageUrl(image.url);
  if (url === image.url) return image;
  // Preserve every unrelated field the backend sent on the image object.
  return { ...image, url: url ?? null };
}

/**
 * Normalize a bare image URL string.
 *
 * @param {unknown} url
 * @returns {string | null} the safe URL, or null when rejected
 */
export function normalizeImageUrl(url) {
  return safeImageUrl(url);
}
