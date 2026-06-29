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

// Home page layout (kept as inner component so we can mount modal state)
const HomePage = () => (
  <main>
    <Hero />
    <PopularChoreographies />
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar onLoginClick={openModal} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/choreographies/:id" element={<ChoreographyDetail />} />
        <Route path="/choreographies" element={<Choreographies />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/verificar-email/:token" element={<VerifyEmail />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>

      <Footer />
      <AuthModal isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
};

export default App;
