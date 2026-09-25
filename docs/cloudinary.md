# Cloudinary assets

Images are served from Cloudinary instead of the bundle. The pattern is
ported from `glass-waitlist-v1` (the marketing site), which rolled this out
first — keep the two in sync (see README's two-repo rule).

## How it works

1. **Source files stay in `src/assets/`.** They're still the originals; the
   bundle just stops importing them directly.
2. **Upload script** — `scripts/upload-assets-to-cloudinary.mjs` walks
   `src/assets/`, uploads every image to Cloudinary, and derives each
   public id deterministically:

   `"glass/" + <path relative to src/assets, extension stripped>`

   e.g. `src/assets/hero/hero.webp` → `glass/hero/hero`. No manifest to
   keep in sync — if you know the file path you know the public id.

   ```bash
   node scripts/upload-assets-to-cloudinary.mjs --dry-run   # preview mapping
   node scripts/upload-assets-to-cloudinary.mjs             # upload everything
   node scripts/upload-assets-to-cloudinary.mjs --scope     # landing + auth/brand assets only
   node scripts/upload-assets-to-cloudinary.mjs --dry-run --scope  # preview that subset
   ```

   Requires `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
   `CLOUDINARY_API_SECRET` in `.env` (script-time only — never shipped).

   `--scope` skips assets that intentionally stay bundled: dashboard and
   member-app empty-states/icons, `icons/upload-cloud`, the mobile auth CSS
   backdrop, usecase corner art (pure CSS), `.bg-problem-glow`, and the
   Figma handoff drafts / debug `laptop.jpg`. The exclude list lives in the
   script next to the usage docs.

3. **Delivery helper** — `src/lib/cloudinary.js` builds CDN URLs
   (`cldUrl`) and responsive `srcSet` strings (`cldSrcSet`). No Cloudinary
   SDK is ever shipped to the browser; every transformation is a URL
   segment (`f_auto`, `q_auto`, `w_`, `dpr_`, `c_limit`).
4. **Components** — one of two render styles:
   - `CloudImage` (`src/components/common/CloudImage.jsx`) for images
     rendered in a fixed-size box: blur-up LQIP placeholder, responsive
     srcSet, lazy/eager control, `objectFit="cover"|"contain"`.
   - Raw `cldUrl()`/`cldSrcSet()` `<img>` for aspect-driven images whose
     natural size decides the box height (`w-full h-auto`), and
     `cldUrl()` for CSS backgroundImage.

## Use-case carousel photos

The Use Cases section (`src/components/UseCases.jsx`) shuffles 12 photos per
category (48 total) from Cloudinary:

- **Manifest** — `src/components/usecasePhotos.js` is the source of truth:
  `publicId` (`glass/usecase/<category>/<code>`), the original Pexels URL
  (provenance — [Pexels license](https://www.pexels.com/license/): free for
  commercial use, attribution not required) and `alt` text. Imported by both
  the component (public ids + alts) and the upload script.
- **Upload script** — manifest-driven, uploads by fetching each original URL,
  and skips public ids that already exist, so it is re-runnable after adding
  photos:

  ```bash
  node scripts/upload-usecase-photos.mjs --dry-run   # preview
  node scripts/upload-usecase-photos.mjs             # upload missing photos
  ```

- Delivery uses `q_auto:best` at widths `[640, 960, 1280, 1600]` (`cldSrcSet`
  accepts an optional opts object forwarded to `cldUrl` per width).
- The same manifest/script exists in `glass-waitlist-v1` — keep the two in
  sync (the photos are uploaded once to the shared cloud).

## Env vars

| Variable                     | Used by                           | Notes                                               |
| ---------------------------- | --------------------------------- | --------------------------------------------------- |
| `VITE_CLOUDINARY_CLOUD_NAME` | browser (`src/lib/cloudinary.js`) | exposed to the client                               |
| `CLOUDINARY_CLOUD_NAME`      | upload script                     | server-side only                                    |
| `CLOUDINARY_API_KEY`         | upload script                     | server-side only                                    |
| `CLOUDINARY_API_SECRET`      | upload script                     | server-side only — never ship, `.env` is gitignored |

## Conventions

- `width` in `CloudImage` should be the largest size the image renders at;
  srcSet buckets are derived from it (see `cldSrcSet`/`widthsFor`).
- CSS `backgroundImage` uses `cldUrl(pid, { width, dpr: 2 })` instead of a
  srcSet (no `decoding`/responsive semantics on a background).
- Deterministic, shared public ids mean `glass-waitlist` and
  `glass-waitlist-v1` resolve the same brand assets to the same CDN URL —
  that's intentional. Uploads use `overwrite: true`; last writer wins.
- Don't add new static assets to `public/` for landing imagery — prefer
  `src/assets/` + the upload script so both repos stay on one source.
