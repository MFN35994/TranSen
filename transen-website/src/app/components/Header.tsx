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
      className="sticky top-0 z-50 transition-all duration-200 border-b border-emerald-950/10"
      style={
        scrolled
          ? {
              backgroundColor: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              boxShadow: "0 10px 35px -10px rgba(6, 78, 59, 0.14)",
            }
          : {
              backgroundColor: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }
      }
    >
      {/* Futuristic Cyber-Emerald & Cyan Scroll Telemetry Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 origin-left z-50 shadow-[0_0_14px_rgba(6,182,212,0.55)]"
        style={{ scaleX }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center" style={{ height: "74px" }}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-emerald-600 rounded-xl">
            <div className="relative p-0.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo.png"
                alt="TranSen Logo"
                className="w-9 h-9 rounded-[10px] object-contain bg-white"
              />
            </div>
            <div>
              <div className="text-xl leading-none font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                TranSen
              </div>
              <div className="text-[11px] text-slate-500 font-medium leading-none mt-1 tracking-wide">
                Mobilité Futuriste · 2%
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 xl:gap-1" aria-label="Navigation principale">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-2.5 py-2 xl:px-3.5 rounded-xl text-xs xl:text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  isActive(link.path)
                    ? "text-emerald-700 bg-emerald-50/80"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-2 xl:gap-3">
            <Link
              to="/chauffeurs"
              className="px-3 py-2 xl:px-4 text-[11px] xl:text-sm rounded-xl border border-emerald-600/35 text-emerald-700 font-bold transition-all duration-150 hover:bg-emerald-50 hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              Devenir Chauffeur
            </Link>
            <Link
              to="/contact"
              className="px-3.5 py-2 xl:px-5 xl:py-2.5 rounded-xl text-[11px] xl:text-sm text-slate-950 font-extrabold transition-all duration-150 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              Télécharger l'App
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden overflow-hidden border-t border-emerald-100"
            style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1" aria-label="Navigation mobile">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-3 px-4 rounded-xl transition-colors text-sm font-semibold ${
                    isActive(link.path)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                <Link
                  to="/chauffeurs"
                  className="flex-1 py-3 text-center rounded-xl border border-emerald-600 text-emerald-700 font-bold text-sm"
                >
                  Devenir Chauffeur
                </Link>
                <Link
                  to="/contact"
                  className="flex-1 py-3 text-center rounded-xl text-sm text-slate-950 font-bold bg-gradient-to-r from-amber-400 to-yellow-400"
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
