import axios from "axios";

const base = "http://localhost:5001/api/v1";

let accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
let refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

export function setAuthTokens(at, rt) {
  accessToken = at || null;
  refreshToken = rt || null;
  if (at) localStorage.setItem("accessToken", at); else localStorage.removeItem("accessToken");
  if (rt) localStorage.setItem("refreshToken", rt); else localStorage.removeItem("refreshToken");
}
export function clearAuthTokens() {
  setAuthTokens(null, null);
}

// allow AuthContext to react (logout, redirect)
let unauthorizedHandler = null;
export function onUnauthorized(fn) { unauthorizedHandler = fn; }

// main axios instance
export const api = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
});

// attach Authorization
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// refresh mechanics (single-flight + queue)
let isRefreshing = false;
let queue = [];
const enqueue = (resolve, reject) => queue.push({ resolve, reject });
const flushQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

async function performRefresh() {
  // use a bare client so we don't recurse interceptors
  const bare = axios.create({ baseURL: base, headers: { "Content-Type": "application/json" } });
  const payload = refreshToken ? { refreshToken } : {}; // if you store refresh in cookie, this can be {}
  const res = await bare.post("/auth/refresh", payload);
  const data = res?.data?.data ?? res?.data ?? {};
  const newAT = data.accessToken || data.access || data.token;
  const newRT = data.refreshToken || refreshToken; // support rotation or keep old
  if (!newAT) throw new Error("No access token from refresh");
  setAuthTokens(newAT, newRT);
  return newAT;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { response, config } = error;
    if (!response) return Promise.reject(error);
    const original = config;

    // don't loop & don't intercept the refresh call itself
    const isRefreshCall = original?.url?.includes("/auth/refresh");
    if (response.status !== 401 || original._retry || isRefreshCall) {
      return Promise.reject(error);
    }
    if (!refreshToken) {
      clearAuthTokens();
      if (unauthorizedHandler) unauthorizedHandler();
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // wait for ongoing refresh
      return new Promise((resolve, reject) => {
        enqueue(resolve, reject);
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    isRefreshing = true;
    try {
      const newToken = await performRefresh();
      flushQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      flushQueue(e, null);
      clearAuthTokens();
      if (unauthorizedHandler) unauthorizedHandler();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

// compatibility helpers you already used
export function setAuthToken(token) {
  if (token) {
    setAuthTokens(token, refreshToken);
  } else {
    clearAuthTokens();
  }
}

// Forgot password functions (3-step flow)
export async function forgotPasswordStep1(empNo) {
  try {
    const response = await axios.post(`${base}/auth/forgot-password/step1`, { empNo });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function forgotPasswordStep2(userId, code) {
  try {
    const response = await axios.post(`${base}/auth/forgot-password/step2`, { userId, code });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function forgotPasswordStep3(userId, newPassword, confirmPassword) {
  try {
    const response = await axios.post(`${base}/auth/forgot-password/step3`, {
      userId,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
