// GET /user/me doesn't return firstName/lastName/phone/profileImage as flat
// fields — they're nested in userData, which can come back as a JSON string
// or an object depending on the field.
export function parseUserData(profile) {
  try {
    const ud = typeof profile?.userData === "string" ? JSON.parse(profile.userData) : profile?.userData;
    return ud ?? {};
  } catch {
    return {};
  }
}
