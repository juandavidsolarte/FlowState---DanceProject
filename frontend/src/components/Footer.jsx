import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} Flowstate. Todos los derechos reservados.
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-purple-600">
            Inicio
          </Link>
          <Link to="/about" className="text-gray-600 hover:text-purple-600">
            Sobre Nosotros
          </Link>
          <Link to="/courses" className="text-gray-600 hover:text-purple-600">
            Cursos
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
