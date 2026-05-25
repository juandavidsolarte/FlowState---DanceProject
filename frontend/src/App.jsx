import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AuthModal from "./components/AuthModal";
import PopularChoreographies from "./components/PopularChoreographies";
import ChoreographyDetail from "./components/ChoreographyDetail";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Choreographies from "./pages/Choreographies";
import Footer from "./components/Footer";

/**
 * App - Route setup
 *
 * This file defines top-level routes for the SPA:
 * - `/` renders the home page (Hero + PopularChoreographies) and mounts the
 *   authentication modal state.
 * - `/choreographies/:id` renders the choreography detail/landing page.
 *
 * The modal state is kept in `HomePage` so the modal can be opened from the
 * `Navbar` (via `openModal`) while keeping routing concerns separated.
 */

// Home page layout (kept as inner component so we can mount modal state)
const HomePage = () => (
  <main>
    <Hero />
    <PopularChoreographies />
  </main>
);

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={openModal} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/choreographies/:id" element={<ChoreographyDetail />} />
        <Route path="/choreographies" element={<Choreographies />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>

      <Footer />
      <AuthModal isOpen={isModalOpen} closeModal={closeModal} />
    </div>
  );
};

export default App;
