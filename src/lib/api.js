// // src/lib/api.js
// // Central axios instance for all API calls.

// import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// export const api = axios.create({
//   baseURL: `${BASE_URL}/api/v1`,
//   headers: { "Content-Type": "application/json" },
// });

// // ── Attach access token to every request ──────────────────────────────────────
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // ── Auto-refresh on 401 ────────────────────────────────────────────────────────
// let isRefreshing = false;
// let refreshQueue = [];

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       const refreshToken = localStorage.getItem("refreshToken");
//       if (!refreshToken) {
//         clearAuthStorage();
//         return Promise.reject(error);
//       }

//       if (isRefreshing) {
//         // queue requests while a refresh is already in-flight
//         return new Promise((resolve, reject) => {
//           refreshQueue.push({ resolve, reject, originalRequest });
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const { data } = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh`, {
//           refreshToken,
//           deviceInfo: navigator.userAgent,
//         });

//         const newAccessToken = data.data.accessToken;
//         const newRefreshToken = data.data.refreshToken;

//         localStorage.setItem("accessToken", newAccessToken);
//         localStorage.setItem("refreshToken", newRefreshToken);

//         // retry queued requests
//         refreshQueue.forEach(({ resolve, originalRequest: queuedRequest }) => {
//           queuedRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//           resolve(api(queuedRequest));
//         });
//         refreshQueue = [];

//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         refreshQueue.forEach(({ reject }) => reject(refreshError));
//         refreshQueue = [];
//         clearAuthStorage();
//         window.location.href = "/member/signup";
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export function clearAuthStorage() {
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("refreshToken");
//   localStorage.removeItem("userId");
//   localStorage.removeItem("userEmail");
// }

// export default api;

// src/lib/api.js
// Central axios instance for all API calls.

import axios from "axios";

// In dev, requests go to "" (relative /api/v1/...) so Vite's proxy intercepts
// them and forwards server-side, avoiding the browser CORS check entirely.
// In production (no Vite dev server), this must point straight at the real
// backend — set VITE_API_BASE_URL in your production environment.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// ── Attach access token to every request ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auto-refresh on 401 ────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        clearAuthStorage();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // queue requests while a refresh is already in-flight
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh`, {
          refreshToken,
          deviceInfo: navigator.userAgent,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // retry queued requests
        refreshQueue.forEach(({ resolve, originalRequest: queuedRequest }) => {
          queuedRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(api(queuedRequest));
        });
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue = [];
        clearAuthStorage();
        window.location.href = "/member/signup";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
}

export default api;


