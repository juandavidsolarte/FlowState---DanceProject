import React from "react";
import { ShoppingCart, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../theme/useTheme";

const Navbar = ({ onLoginClick }) => {
  const { isDarkMode, toggleTheme } = useTheme();

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
        <button className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
          <ShoppingCart size={22} />
        </button>

        {/* BOTÓN ACCEDE: Aquí disparamos el modal */}
        <button
          onClick={onLoginClick}
          className="rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-purple-200 transition-transform hover:scale-105 md:px-8"
        >
          Accede
        </button>

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
