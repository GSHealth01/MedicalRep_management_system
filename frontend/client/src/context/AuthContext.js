import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [ready, setReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const at = localStorage.getItem("accessToken");
      const rt = localStorage.getItem("refreshToken");
      if (u && at) {
        setUser(u);
        setAccessToken(at);
        setRefreshToken(rt || null);
        setAuthToken(at);
      }
    } finally {
      setReady(true);
    }
  }, []);

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/signin", { email, password });
    const data = res?.data?.data || res?.data || {};
    const u = data.user || {
      id: data.userId,
      email: data.email || email,
      role: data.role,
    };
    if (!data.accessToken || !u?.role)
      throw new Error("Malformed signin response");

    // persist + set headers
    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(u));
    setAuthToken(data.accessToken);

    setUser(u);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken || null);

    return u; // let caller navigate based on role
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      ready,
      login,
      logout,
      setUser,
    }),
    [user, accessToken, refreshToken, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
