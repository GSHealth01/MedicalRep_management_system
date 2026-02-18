import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  api,
  setAuthTokens,
  clearAuthTokens,
  onUnauthorized,
} from "../services/api";

const AuthContext = createContext(null);

// Helper to decode JWT and get expiry
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAT] = useState(null);
  const [refreshToken, setRT] = useState(null);
  const [ready, setReady] = useState(false);
  const refreshTimerRef = useRef(null);

  // Load from storage
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const at = localStorage.getItem("accessToken");
      const rt = localStorage.getItem("refreshToken");
      console.log('[AuthContext] Loading from storage:', { user: !!u, hasAccessToken: !!at, hasRefreshToken: !!rt });
      if (u && at) {
        setUser(u);
        setAT(at);
        setRT(rt);
        setAuthTokens(at, rt); // seeds api's in-memory
        console.log('[AuthContext] Tokens loaded successfully');
      } else {
        console.log('[AuthContext] No tokens found - user needs to login');
      }
    } catch (e) {
      console.error('[AuthContext] Error loading auth data:', e);
    } finally {
      setReady(true);
    }
  }, []);

  // Setup silent token refresh
  useEffect(() => {
    if (!ready || !refreshToken || !accessToken) return;

    const scheduleRefresh = () => {
      const expiry = getTokenExpiry(accessToken);
      if (!expiry) {
        console.log('[AuthContext] Could not decode token expiry');
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      const refreshBeforeExpiry = Math.max(timeUntilExpiry - 60000, 60000); // Refresh 1 minute before expiry, minimum 1 minute

      console.log('[AuthContext] Token expires in', Math.round(timeUntilExpiry / 60000), 'minutes, scheduling refresh in', Math.round(refreshBeforeExpiry / 60000), 'minutes');

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(async () => {
        console.log('[AuthContext] Performing silent token refresh...');
        try {
          const res = await api.post("/auth/refresh", { refreshToken });
          const data = res?.data?.data ?? res?.data ?? {};
          if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem("refreshToken", data.refreshToken);
            }
            setAuthTokens(data.accessToken, data.refreshToken || refreshToken);
            setAT(data.accessToken);
            if (data.refreshToken) setRT(data.refreshToken);
            console.log('[AuthContext] Silent refresh successful');
            scheduleRefresh(); // Schedule next refresh
          }
        } catch (e) {
          console.error('[AuthContext] Silent refresh failed:', e.message);
          // Don't logout immediately - let the next API call handle it
        }
      }, refreshBeforeExpiry);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [ready, refreshToken, accessToken]);

  // Global unauthorized handler (refresh failed)
  useEffect(() => {
    onUnauthorized(() => {
      // logout & send to login
      clearAuthTokens();
      setUser(null);
      setAT(null);
      setRT(null);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      window.location.replace("/login");
    });
  }, []);

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/signin", { email, password });
    const data = res?.data || {};
    const u = data.user;
    console.log('[AuthContext] Login response received:', { hasUser: !!u, hasAccessToken: !!data.accessToken, hasRefreshToken: !!data.refreshToken });
    if (!data.accessToken || !u?.designation) {
      console.error('[AuthContext] Malformed signin response');
      throw new Error("Malformed signin response");
    }

    // persist
    localStorage.setItem("user", JSON.stringify(u));
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
      console.log('[AuthContext] Saved refreshToken to localStorage');
    } else {
      console.warn('[AuthContext] No refreshToken in login response!');
    }
    localStorage.setItem("accessToken", data.accessToken);
    console.log('[AuthContext] Saved accessToken to localStorage');

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
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
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
