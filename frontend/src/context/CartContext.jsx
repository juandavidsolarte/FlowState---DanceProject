import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const CART_SESSION_KEY = "flowstate_cart_session_id";
const AUTH_EVENT = "flowstate:auth-changed";

const CartContext = createContext(null);

const normalizeCartItem = (item) => ({
  id: String(item.coreografia_id ?? item.id),
  coreografiaId: Number(item.coreografia_id ?? item.id),
  title: item.titulo || item.title || "Sin título",
  price: Number(item.precio ?? item.price ?? 0),
  thumbnail: item.thumbnail_url || item.thumbnail || item.img || "",
  img: item.thumbnail_url || item.thumbnail || item.img || "",
  category: item.genero || item.category || item.genre || "",
  level: item.level || item.nivel || "",
  duration: item.duration || "",
  rating: item.rating ?? null,
});

const getStoredSessionId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(CART_SESSION_KEY);
  } catch (error) {
    return null;
  }
};

const setStoredSessionId = (sessionId) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (sessionId) {
      window.localStorage.setItem(CART_SESSION_KEY, sessionId);
    } else {
      window.localStorage.removeItem(CART_SESSION_KEY);
    }
  } catch (error) {
    // Best effort.
  }
};

const clearSessionId = () => setStoredSessionId(null);

const ensureSessionId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = getStoredSessionId();
  if (existing) {
    return existing;
  }

  const sessionId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  setStoredSessionId(sessionId);
  return sessionId;
};

const isAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem("access_token"));
};

const extractCartPayload = (payload) => {
  if (!payload) {
    return { items: [], subtotal: 0, iva: 0, total: 0 };
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: rawItems.map(normalizeCartItem),
    subtotal: Number(payload.subtotal ?? 0),
    iva: Number(payload.iva_monto ?? 0),
    total: Number(payload.total ?? 0),
  };
};

const getCartHeaders = () => {
  if (isAuthenticated()) {
    return {};
  }

  const sessionId = ensureSessionId();

  return sessionId ? { "X-Session-ID": sessionId } : {};
};

const loadCartFromBackend = async () => {
  const response = await api.get("/carrito/", {
    headers: getCartHeaders(),
  });

  return extractCartPayload(response.data);
};

const mergeAnonymousCart = async () => {
  const sessionId = getStoredSessionId();

  if (!sessionId || !isAuthenticated()) {
    return null;
  }

  const response = await api.post("/carrito/merge/", {
    session_id: sessionId,
  });

  clearSessionId();
  return extractCartPayload(response.data);
};

const saveSessionIdForAnonymous = () => {
  ensureSessionId();
};

const mapCartError = (error) => {
  const message = error.response?.data?.error || error.response?.data?.detail || error.message;

  if (typeof message !== "string") {
    return "No pudimos actualizar tu carrito.";
  }

  if (message.includes("ya está en el carrito")) {
    return "Ya está en tu carrito";
  }

  if (message.includes("Ya compraste esta coreografía")) {
    return "Ya compraste esta coreografía";
  }

  return message;
};

export const CartProvider = ({ children, onRequireAuth }) => {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const syncCart = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const authenticated = isAuthenticated();

      if (authenticated) {
        let merged = null;

        try {
          merged = await mergeAnonymousCart();
        } catch (mergeError) {
          merged = null;
        }

        const cartPayload = merged || (await loadCartFromBackend());

        setItems(cartPayload.items);
        setSubtotal(cartPayload.subtotal);
        setIva(cartPayload.iva);
        setTotal(cartPayload.total);
        return;
      }

      saveSessionIdForAnonymous();
      const cartPayload = await loadCartFromBackend();

      setItems(cartPayload.items);
      setSubtotal(cartPayload.subtotal);
      setIva(cartPayload.iva);
      setTotal(cartPayload.total);
    } catch (requestError) {
      setError(mapCartError(requestError));
      setItems([]);
      setSubtotal(0);
      setIva(0);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncCart();
  }, [syncCart]);

  useEffect(() => {
    const handleAuthChange = () => {
      syncCart();
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
    };
  }, [syncCart]);

  const openDrawer = useCallback(() => {
    setDrawerAbierto(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerAbierto(false);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  const agregarItem = useCallback(
    async (coreografiaOrId) => {
      const coreografiaId = Number(
        coreografiaOrId?.coreografiaId ??
          coreografiaOrId?.coreografia_id ??
          coreografiaOrId?.id ??
          coreografiaOrId,
      );

      if (!coreografiaId) {
        setError("No pudimos identificar la coreografía.");
        openDrawer();
        return;
      }

      clearMessage();

      try {
        const response = await api.post(
          "/carrito/items/",
          { coreografia_id: coreografiaId },
          { headers: getCartHeaders() },
        );

        const cartPayload = extractCartPayload(response.data);
        setItems(cartPayload.items);
        setSubtotal(cartPayload.subtotal);
        setIva(cartPayload.iva);
        setTotal(cartPayload.total);
        setMessage("Agregado al carrito");
        setDrawerAbierto(true);
      } catch (requestError) {
        setError(mapCartError(requestError));
        setDrawerAbierto(true);
      }
    },
    [clearMessage, openDrawer],
  );

  const eliminarItem = useCallback(async (coreografiaId) => {
    clearMessage();

    try {
      const response = await api.delete(`/carrito/items/${coreografiaId}/`, {
        headers: getCartHeaders(),
      });

      if (response.status === 204) {
        await syncCart();
      }
    } catch (requestError) {
      setError(mapCartError(requestError));
    }
  }, [clearMessage, syncCart]);

  const limpiarCarrito = useCallback(async () => {
    clearMessage();

    try {
      await Promise.all(items.map((item) => api.delete(`/carrito/items/${item.coreografiaId}/`, {
        headers: getCartHeaders(),
      })));
      await syncCart();
    } catch (requestError) {
      setError(mapCartError(requestError));
    }
  }, [clearMessage, items, syncCart]);

  const toggleDrawer = useCallback(() => {
    setDrawerAbierto((current) => !current);
  }, []);

  const isInCart = useCallback(
    (id) => items.some((item) => String(item.coreografiaId) === String(id)),
    [items],
  );

  const value = useMemo(() => {
    return {
      items,
      drawerAbierto,
      subtotal,
      iva,
      total,
      cantidadItems: items.length,
      isLoading,
      message,
      error,
      agregarItem,
      eliminarItem,
      limpiarCarrito,
      toggleDrawer,
      closeDrawer,
      openDrawer,
      clearMessage,
      isInCart,
      refreshCart: syncCart,
    };
  }, [
    agregarItem,
    clearMessage,
    closeDrawer,
    drawerAbierto,
    eliminarItem,
    error,
    isInCart,
    isLoading,
    items,
    limpiarCarrito,
    message,
    openDrawer,
    subtotal,
    syncCart,
    total,
    toggleDrawer,
    iva,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};

export const notifyAuthChanged = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
};
