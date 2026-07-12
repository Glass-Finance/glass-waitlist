import { useEffect } from "react";

const BASE = "Glasspay";
const SITE_URL = "https://glasspay.app";

function setMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// index.html's static <meta name="description"> and <link rel="canonical">
// are only ever correct for "/" — every other public route (currently just
// /members) shares that same index.html and would otherwise silently claim
// the homepage's description and, worse, tell Google via canonical that
// it's a duplicate of the homepage rather than its own indexable page.
// Google's crawler does execute JS and re-reads these tags before indexing
// (unlike social-preview bots — see the note on OG tags in index.html),
// so setting them here actually reaches search results, just not link-
// preview cards, which stay pinned to the homepage's static OG/Twitter
// tags for every route until this app has real per-route SSR.
export function useSeoMeta({ title, description, path = "/" }) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — Community Finance Crystal Clear`;
    if (description) setMeta("description", description);
    setCanonical(`${SITE_URL}${path}`);
  }, [title, description, path]);
}
