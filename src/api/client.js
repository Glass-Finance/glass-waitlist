import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Attach JWT to every request ───────────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("glass_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global response handler ───────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired or invalid → clear session and redirect to sign-in
    if (error.response?.status === 401) {
      localStorage.removeItem("glass_token");
      window.location.href = "/member/sign-in";
    }
    return Promise.reject(error);
  }
);

export default client;
