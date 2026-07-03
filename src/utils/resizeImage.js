// Community/profile logos get rendered as small avatars (28-44px) everywhere
// in the app, but nothing on the backend resizes an upload — an admin
// uploading a straight-from-camera photo (often several MB) means every
// viewer downloads that full original just to paint a thumbnail. Downscaling
// client-side before upload fixes it at the source for every consumer.
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Downscales an image file to at most MAX_DIMENSION on its longest side and
 * re-encodes it, returning a File no larger than needed for avatar display.
 * PNGs (which may carry transparency, common for logos) stay PNG; everything
 * else is re-encoded as JPEG. Falls back to the original file if anything
 * about the resize fails or if the file is already small/non-resizable
 * (e.g. SVG, which is already tiny and vector so resizing it would be lossy).
 */
export async function resizeImageFile(file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) {
  if (!file?.type?.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    if (scale >= 1) return file; // already small enough

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, outputType, quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = outputType === "image/png" ? "png" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + `.${ext}`;
    return new File([blob], name, { type: outputType });
  } catch {
    return file;
  }
}
