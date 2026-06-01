// src/api/auth.js
import client from "./client";

export const login = (email, password) =>
  client.post("/auth/login", { email, password });
  // returns { success, message, data: { token, refreshToken, user }, status }

export const register = (payload) =>
  client.post("/auth/register", payload);

export const logout = () =>
  client.post("/auth/logout");