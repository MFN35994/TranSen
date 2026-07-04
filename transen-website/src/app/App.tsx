import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { Tarifs } from "./pages/Tarifs";
import { Chauffeurs } from "./pages/Chauffeurs";
import { About } from "./pages/About";
import { Team } from "./pages/Team";
import { FAQ } from "./pages/FAQ";
import { Contact } from "./pages/Contact";
import { Investir } from "./pages/Investir";
import { Compagnies } from "./pages/Compagnies";
import { CGU } from "./pages/CGU";
import { Politique } from "./pages/Politique";
import { Mentions } from "./pages/Mentions";
import { PremiumAmbientEngine } from "./components/PremiumAmbientEngine";
import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      <PremiumAmbientEngine />
      <Header />
      <main className="flex-1 z-10 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/services" element={<PageWrapper><Services /></PageWrapper>} />
            <Route path="/tarifs" element={<PageWrapper><Tarifs /></PageWrapper>} />
            <Route path="/chauffeurs" element={<PageWrapper><Chauffeurs /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/team" element={<PageWrapper><Team /></PageWrapper>} />
            <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
            <Route path="/investir" element={<PageWrapper><Investir /></PageWrapper>} />
            <Route path="/compagnies" element={<PageWrapper><Compagnies /></PageWrapper>} />
            <Route path="/cgu" element={<PageWrapper><CGU /></PageWrapper>} />
            <Route path="/conditions" element={<PageWrapper><CGU /></PageWrapper>} />
            <Route path="/politique" element={<PageWrapper><Politique /></PageWrapper>} />
            <Route path="/confidentialite" element={<PageWrapper><Politique /></PageWrapper>} />
            <Route path="/mentions" element={<PageWrapper><Mentions /></PageWrapper>} />
            <Route path="/mentions-legales" element={<PageWrapper><Mentions /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
