// src/api/client.js
import axios from "axios";

const client = axios.create({
  baseURL: "https://api.glasspay.app",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res.data,          // unwraps the axios response
  (err) => {
    const apiError = err.response?.data; 
    // shape: { success, message, data, description, status }
    if (apiError?.status === "UNAUTHORIZED") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(apiError);
  }
);

export default client;