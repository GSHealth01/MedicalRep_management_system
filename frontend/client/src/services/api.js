import axios from "axios";

const base = "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" }
});

// Allow context to update the default Authorization header
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.Authorization;
  }
}

// Fallback: if page hard-refreshes, try localStorage once
const cached = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
if (cached) setAuthToken(cached);
