import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  setAuthTokens,
  clearAuthTokens,
  onUnauthorized,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAT] = useState(null);
  const [refreshToken, setRT] = useState(null);
  const [ready, setReady] = useState(false);

  // Load from storage
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const at = localStorage.getItem("accessToken");
      const rt = localStorage.getItem("refreshToken");
      if (u && at) {
        setUser(u);
        setAT(at);
        setRT(rt);
        setAuthTokens(at, rt); // seeds api's in-memory
      }
    } finally {
      setReady(true);
    }
  }, []);

  // Global unauthorized handler (refresh failed)
  useEffect(() => {
    onUnauthorized(() => {
      // logout & send to login
      clearAuthTokens();
      setUser(null);
      setAT(null);
      setRT(null);
      window.location.replace("/login");
    });
  }, []);

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/signin", { email, password });
    const data = res?.data || {};
    const u = data.user;
    if (!data.accessToken || !u?.designation)
      throw new Error("Malformed signin response");

    // persist
    localStorage.setItem("user", JSON.stringify(u));
    if (data.refreshToken)
      localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("accessToken", data.accessToken);

    setAuthTokens(
      data.accessToken,
      data.refreshToken
    );
    setUser(u);
    setAT(data.accessToken);
    setRT(data.refreshToken);

    return u;
  };

  const logout = () => {
    clearAuthTokens();
    localStorage.removeItem("user");
    setUser(null);
    setAT(null);
    setRT(null);
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
