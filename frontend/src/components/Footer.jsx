import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Flowstate. Todos los derechos reservados.
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
            Inicio
          </Link>
          <Link to="/about" className="text-muted-foreground transition-colors hover:text-foreground">
            Sobre Nosotros
          </Link>
          <Link to="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
            Cursos
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
