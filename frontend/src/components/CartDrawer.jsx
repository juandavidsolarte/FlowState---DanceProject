import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "../context/CartContext";

const formatPrice = (value) =>
  `$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CartDrawer = () => {
  const {
    items,
    drawerAbierto,
    subtotal,
    iva,
    total,
    eliminarItem,
    limpiarCarrito,
    closeDrawer,
  } = useCart();

  const handleCheckout = () => {
    window.alert("Próximamente");
  };

  return (
    <AnimatePresence>
      {drawerAbierto ? (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Cerrar carrito"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />

          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-purple-900/30 bg-[#130d26] text-white shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-purple-900/30 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">Tu carrito</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {items.length} {items.length === 1 ? "coreografía" : "coreografías"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-purple-900/30 p-2 text-gray-300 transition hover:border-purple-400/40 hover:text-white"
                aria-label="Cerrar carrito"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-3xl border border-purple-900/20 bg-[#0f0a1e] p-4 shadow-lg shadow-black/20"
                    >
                      <img
                        src={item.thumbnail || item.img}
                        alt={item.title}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-white">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">
                              {item.category}
                              {item.level ? ` · ${item.level}` : ""}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => eliminarItem(item.id)}
                            className="rounded-full border border-red-500/20 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20"
                            aria-label={`Eliminar ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
                          <span>{item.duration || "Duración no disponible"}</span>
                          <span className="font-semibold text-purple-200">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-purple-900/30 bg-[#0f0a1e] px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/15 text-purple-300">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">Tu carrito está vacío</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Agrega una coreografía para verla aquí y continuar con el flujo de compra.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-purple-900/30 bg-[#0f0a1e] px-6 py-5">
              <div className="space-y-3 rounded-3xl border border-purple-900/20 bg-[#130d26] p-4">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>IVA (19%)</span>
                  <span>{formatPrice(iva)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-purple-900/20 pt-3 text-lg font-bold text-white">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-2xl border border-purple-900/30 px-4 py-3 font-medium text-white transition hover:bg-purple-900/15"
                >
                  Seguir comprando
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:opacity-95"
                >
                  Proceder al pago <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={limpiarCarrito}
                  className="mt-3 text-sm font-medium text-gray-400 transition hover:text-white"
                >
                  Vaciar carrito
                </button>
              ) : null}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default CartDrawer;