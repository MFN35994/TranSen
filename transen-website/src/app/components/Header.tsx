import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Bus } from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";

const NAV_LINKS = [
  { name: "Accueil", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Tarifs", path: "/tarifs" },
  { name: "Compagnies", path: "/compagnies" },
  { name: "Chauffeurs", path: "/chauffeurs" },
  { name: "Investisseurs", path: "/investir" },
  { name: "À Propos", path: "/about" },
  { name: "FAQ", path: "/faq" },
  { name: "Contact", path: "/contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300 relative"
      style={
        scrolled
          ? {
              backgroundColor: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 1px 24px rgba(0,0,0,0.08)",
            }
          : { backgroundColor: "rgba(255,255,255,0.98)" }
      }
    >
      {/* Premium Ultra Scroll Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 origin-left z-50 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
        style={{ scaleX }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18" style={{ height: "72px" }}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="TranSen Logo"
              className="w-10 h-10 rounded-xl object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <div className="text-xl leading-none font-bold" style={{ color: "var(--brand-green)" }}>
                TranSen
              </div>
              <div className="text-xs text-gray-400 leading-none mt-0.5">
                Mobilité Sénégal
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 xl:gap-1.5">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-2 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all hover:bg-gray-50/80 ${
                  isActive(link.path) ? "" : "text-gray-600"
                }`}
                style={isActive(link.path) ? { color: "var(--brand-green)" } : {}}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--brand-green)" }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-1.5 xl:gap-3">
            <Link
              to="/chauffeurs"
              className="px-2.5 py-1.5 xl:px-4 xl:py-2 text-[11px] xl:text-sm rounded-xl border font-bold transition-all hover:bg-gray-50"
              style={{ borderColor: "var(--brand-green)", color: "var(--brand-green)" }}
            >
              Devenir Chauffeur
            </Link>
            <Link
              to="/contact"
              className="px-3 py-2 xl:px-5 xl:py-2.5 rounded-xl text-[11px] xl:text-sm text-gray-900 font-bold transition-all hover:shadow-lg hover:scale-[1.02]"
              style={{ backgroundColor: "var(--brand-gold)" }}
            >
              Télécharger l'App
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
            aria-label="Menu"
          >
            {menuOpen
              ? <X className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
              : <Menu className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
            }
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-gray-100"
            style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-3 px-4 rounded-xl transition-colors text-sm ${
                    isActive(link.path) ? "bg-green-50" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={isActive(link.path) ? { color: "var(--brand-green)" } : {}}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <Link
                  to="/chauffeurs"
                  className="flex-1 py-3 text-center rounded-xl border text-sm"
                  style={{ borderColor: "var(--brand-green)", color: "var(--brand-green)" }}
                >
                  Devenir Chauffeur
                </Link>
                <Link
                  to="/contact"
                  className="flex-1 py-3 text-center rounded-xl text-sm text-gray-900"
                  style={{ backgroundColor: "var(--brand-gold)" }}
                >
                  Télécharger
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
