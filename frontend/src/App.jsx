import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AuthModal from "./components/AuthModal";
import PopularChoreographies from "./components/PopularChoreographies";
import ChoreographyDetail from "./components/ChoreographyDetail";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Choreographies from "./pages/Choreographies";
import Footer from "./components/Footer";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Catalog from "./pages/Catalog";
import CatalogDetail from "./pages/CatalogDetail";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Equipo from "./pages/admin/Equipo";
import MiPerfil from "./pages/MiPerfil";
import ClientLayout from "./layouts/ClientLayout";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";

const HomePage = () => (
  <main>
    <Hero />
    <PopularChoreographies />
  </main>
);

const ProfessorPlaceholder = () => (
  <main className="min-h-screen bg-[#0f0a1e] px-6 py-20 text-white">
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-purple-900/20 bg-[#130d26] p-8 text-center shadow-2xl shadow-black/20">
      <p className="text-sm uppercase tracking-[0.3em] text-purple-300/80">Dashboard profesor</p>
      <h1 className="mt-4 text-4xl font-black">Próximamente</h1>
      <p className="mt-4 text-gray-300">Estamos preparando esta sección para profesores.</p>
    </div>
  </main>
);

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (location.state?.openLogin) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  const isDashboard = location.pathname.startsWith("/dashboard");
  const isCliente = location.pathname.startsWith("/cliente");

  return (
    <AuthProvider>
      <CartProvider onRequireAuth={openModal}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          {!isDashboard && !isCliente && <Navbar onLoginClick={openModal} />}
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/choreographies/:id" element={<ChoreographyDetail />} />
            <Route path="/choreographies" element={<Choreographies />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/catalogo/:id" element={<CatalogDetail />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/verificar-email/:token" element={<VerifyEmail />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/dashboard/profesor" element={<ProfessorPlaceholder />} />

            {/* Rutas del dashboard admin */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/equipo" element={<Equipo />} />
            </Route>

            {/* Rutas del cliente */}
            <Route path="/cliente" element={<ClientLayout />}>
              <Route path="mi-perfil" element={<MiPerfil />} />
            </Route>
          </Routes>
          {!isDashboard && !isCliente && <Footer />}
          {!isDashboard && !isCliente && <CartDrawer />}
          {!isDashboard && !isCliente && <AuthModal isOpen={isModalOpen} closeModal={closeModal} />}
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;