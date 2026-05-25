import React from "react";
import { ShoppingCart, Moon } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = ({ onLoginClick }) => {
  return (
    <nav className="flex items-center justify-between px-10 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg"></div>
        <span className="text-2xl font-bold tracking-tighter text-slate-800">
          flowstate
        </span>
      </div>

      {/* Links Centrales */}
      <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
        <Link to="/" className="hover:text-purple-600 transition-colors">
          Home
        </Link>
        <Link to="/about" className="hover:text-purple-600 transition-colors">
          Sobre Nosotros
        </Link>
        <Link to="/courses" className="hover:text-purple-600 transition-colors">
          Cursos
        </Link>
        <Link
          to="/choreographies"
          className="hover:text-purple-600 transition-colors"
        >
          Coreografías
        </Link>
      </div>

      {/* Botones Derecha */}
      <div className="flex items-center gap-5">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all">
          <ShoppingCart size={22} />
        </button>

        {/* BOTÓN ACCEDE: Aquí disparamos el modal */}
        <button
          onClick={onLoginClick}
          className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-2.5 rounded-full font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
        >
          Accede
        </button>

        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all">
          <Moon size={22} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
