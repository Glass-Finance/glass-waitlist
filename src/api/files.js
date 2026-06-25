import client from "./client";

// POST /api/v1/file/upload — multipart, fileCategory ∈
// PROFILE_IMAGE | COMMUNITY_LOGO | COMMUNITY_BRANDING
export const uploadFile = (file, fileCategory) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("fileCategory", fileCategory);
  return client.post("/file/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
