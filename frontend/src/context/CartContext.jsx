import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const CART_STORAGE_KEY = "flowstate_cart_items";
const AUTH_EVENT = "flowstate:auth-changed";
const VAT_RATE = 0.19;

const CartContext = createContext(null);

const formatCartItem = (item) => ({
  id: String(item.id),
  title: item.title || "Sin título",
  price: Number(item.price ?? 0),
  thumbnail: item.thumbnail || item.img || "",
  img: item.img || item.thumbnail || "",
  category: item.category || item.genre || "",
  level: item.level || "",
  duration: item.duration || "",
  rating: item.rating ?? null,
});

const getStoredItems = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(formatCartItem).filter((item) => item.id);
  } catch (error) {
    return [];
  }
};

const persistItems = (items) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // Persistence is best effort.
  }
};

const dedupeById = (items) => {
  const map = new Map();

  items.forEach((item) => {
    if (item?.id == null) {
      return;
    }

    map.set(String(item.id), formatCartItem(item));
  });

  return Array.from(map.values());
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((accumulator, item) => accumulator + Number(item.price || 0), 0);
  const iva = subtotal * VAT_RATE;
  const total = subtotal + iva;

  return { subtotal, iva, total };
};

const isAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem("access_token"));
};

const loadServerCart = async () => {
  try {
    const response = await api.get("/cart/");
    const serverItems = response.data?.items ?? response.data ?? [];

    return Array.isArray(serverItems) ? serverItems.map(formatCartItem) : [];
  } catch (error) {
    return [];
  }
};

const saveServerCart = async (items) => {
  try {
    await api.post("/cart/merge/", {
      items,
    });
  } catch (error) {
    // The backend cart API may not be available yet.
  }
};

export const CartProvider = ({ children, onRequireAuth }) => {
  const [items, setItems] = useState(() => dedupeById(getStoredItems()));
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  useEffect(() => {
    persistItems(items);
  }, [items]);

  useEffect(() => {
    const handleAuthChange = async () => {
      const localItems = dedupeById(getStoredItems());

      if (!isAuthenticated()) {
        setItems(localItems);
        return;
      }

      const serverItems = await loadServerCart();
      const mergedItems = dedupeById([...serverItems, ...localItems]);

      setItems(mergedItems);
      persistItems(mergedItems);

      if (localItems.length > 0) {
        setDrawerAbierto(true);
      }

      await saveServerCart(mergedItems);
    };

    const handleStorageChange = (event) => {
      if (event.key === CART_STORAGE_KEY) {
        setItems(dedupeById(getStoredItems()));
      }
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const agregarItem = useCallback(
    (coreografia) => {
      if (!coreografia?.id) {
        return;
      }

      const nuevoItem = formatCartItem(coreografia);

      setItems((currentItems) => {
        if (currentItems.some((item) => String(item.id) === nuevoItem.id)) {
          return currentItems;
        }

        return [...currentItems, nuevoItem];
      });

      if (isAuthenticated()) {
        setDrawerAbierto(true);
        return;
      }

      if (typeof onRequireAuth === "function") {
        onRequireAuth();
      }
    },
    [onRequireAuth],
  );

  const eliminarItem = useCallback((id) => {
    const itemId = String(id);

    setItems((currentItems) => currentItems.filter((item) => String(item.id) !== itemId));
  }, []);

  const limpiarCarrito = useCallback(() => {
    setItems([]);
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerAbierto((current) => !current);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerAbierto(false);
  }, []);

  const value = useMemo(() => {
    const { subtotal, iva, total } = calculateTotals(items);

    return {
      items,
      drawerAbierto,
      subtotal,
      iva,
      total,
      cantidadItems: items.length,
      agregarItem,
      eliminarItem,
      limpiarCarrito,
      toggleDrawer,
      closeDrawer,
      isInCart: (id) => items.some((item) => String(item.id) === String(id)),
    };
  }, [agregarItem, closeDrawer, drawerAbierto, eliminarItem, items, limpiarCarrito, toggleDrawer]);

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
