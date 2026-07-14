import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { notifyAuthChanged } from "./CartContext";

const AUTH_USER_KEY = "auth_user";

const AuthContext = createContext(null);

const readStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (error) {
    // Best-effort persistence.
  }
};

const clearAuthStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem(AUTH_USER_KEY);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => readStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.localStorage.getItem("access_token"));
  });
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((access, user) => {
    if (typeof window !== "undefined" && access) {
      window.localStorage.setItem("access_token", access);
    }

    setUsuario(user);
    setIsAuthenticated(Boolean(user));
    persistUser(user);
  }, []);

  const clearSession = useCallback(() => {
    clearAuthStorage();
    setUsuario(null);
    setIsAuthenticated(false);
    persistUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      const token = window.localStorage.getItem("access_token");

      if (!token) {
        if (active) {
          clearSession();
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/users/me/");
        if (!active) {
          return;
        }

        setSession(token, response.data);
        notifyAuthChanged();
      } catch (error) {
        if (!active) {
          return;
        }

        clearSession();
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, [clearSession, setSession]);

  const login = useCallback(async (email, password, captchaToken) => {
    const response = await api.post("/auth/login/", {
      email,
      password,
      captcha_token: captchaToken,
    });

    const { access, user } = response.data;

    setSession(access, user);
    notifyAuthChanged();

    return response.data;
  }, [setSession]);

  const logout = useCallback(() => {
    clearSession();
    notifyAuthChanged();
    navigate("/");
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({
      usuario,
      isAuthenticated,
      isLoading,
      login,
      logout,
      setSession,
    }),
    [isAuthenticated, isLoading, login, logout, setSession, usuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
