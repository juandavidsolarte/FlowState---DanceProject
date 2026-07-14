import React from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown, LogOut, ShoppingCart, Moon, Sun, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../theme/useTheme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ onLoginClick }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { cantidadItems, toggleDrawer } = useCart();
  const { usuario, isAuthenticated, isLoading, logout } = useAuth();

  const initials = [usuario?.first_name?.[0], usuario?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarLabel = [usuario?.first_name, usuario?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || usuario?.email || "Usuario";

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border/70 bg-background/80 px-6 py-5 backdrop-blur-md transition-colors md:px-10">
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img
          src="/flowstate.png"
          alt="Flowstate"
          className="h-12 w-auto object-contain"
        />
      </Link>

      {/* Links Centrales */}
      <div className="hidden items-center gap-8 font-medium text-muted-foreground md:flex">
        <Link to="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <Link to="/about" className="transition-colors hover:text-foreground">
          Sobre Nosotros
        </Link>
        <Link to="/courses" className="transition-colors hover:text-foreground">
          Cursos
        </Link>
        <Link
          to="/choreographies"
          className="transition-colors hover:text-foreground"
        >
          Coreografías
        </Link>
      </div>

      {/* Botones Derecha */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          onClick={toggleDrawer}
          className="relative rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label="Abrir carrito"
        >
          <ShoppingCart size={22} />
          {cantidadItems > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-lg shadow-purple-950/30">
              {cantidadItems}
            </span>
          )}
        </button>

        {!isLoading && isAuthenticated ? (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 rounded-full border border-purple-900/20 bg-[#130d26] px-2.5 py-1.5 text-left text-white shadow-lg shadow-black/10 transition hover:border-purple-500/30 hover:bg-[#1a1231]">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-sm font-bold text-white">
                {usuario?.avatar_url ? (
                  <img src={usuario.avatar_url} alt={avatarLabel} className="h-full w-full object-cover" />
                ) : (
                  initials || <User className="h-4 w-4" />
                )}
              </span>
              <span className="hidden max-w-40 flex-col text-left md:flex">
                <span className="truncate text-sm font-semibold">{avatarLabel}</span>
                <span className="truncate text-xs text-gray-400">{usuario?.role || "cliente"}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Menu.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 translate-y-1 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-1 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-purple-900/20 bg-[#130d26] p-2 shadow-2xl shadow-black/30 focus:outline-none">
                <div className="rounded-2xl border border-purple-900/20 bg-[#0f0a1e] px-4 py-3">
                  <p className="text-sm font-semibold text-white">{avatarLabel}</p>
                  <p className="mt-1 text-xs text-gray-400">{usuario?.email}</p>
                </div>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/cliente/mi-perfil"
                      className={`mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white transition ${active ? "bg-purple-500/15" : ""}`}
                    >
                      <User className="h-4 w-4 text-purple-300" />
                      Mi perfil
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={logout}
                      className={`mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-200 transition ${active ? "bg-red-500/10" : ""}`}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <button
            onClick={onLoginClick}
            className="rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-purple-200 transition-transform hover:scale-105 md:px-8"
          >
            Accede
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          aria-label={isDarkMode ? "Activar modo claro" : "Activar modo nocturno"}
          aria-pressed={isDarkMode}
          title={isDarkMode ? "Activar modo claro" : "Activar modo nocturno"}
        >
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
