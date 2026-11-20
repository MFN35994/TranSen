import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Download, UserPlus, ChevronRight, ExternalLink, Zap } from "lucide-react";
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

interface HeaderProps {
  emergencyBanner?: string;
}

export function Header({ emergencyBanner }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b"
      style={
        scrolled
          ? {
              backgroundColor: "rgba(3, 16, 11, 0.94)",
              backdropFilter: "blur(24px) saturate(165%)",
              WebkitBackdropFilter: "blur(24px) saturate(165%)",
              borderColor: "rgba(52, 211, 153, 0.3)",
              boxShadow: "0 20px 52px -16px rgba(0, 0, 0, 0.85), 0 1px 0 rgba(52, 211, 153, 0.16) inset",
            }
          : {
              backgroundColor: "rgba(3, 16, 11, 0.82)",
              backdropFilter: "blur(18px) saturate(145%)",
              WebkitBackdropFilter: "blur(18px) saturate(145%)",
              borderColor: "rgba(255, 255, 255, 0.09)",
            }
      }
    >
      {/* Super-Admin Emergency Broadcast Banner */}
      {emergencyBanner && (
        <div className="bg-gradient-to-r from-rose-700 via-amber-600 to-rose-700 text-white text-xs sm:text-sm font-bold py-2 px-4 text-center border-b border-white/20 flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Message du Centre de Commandement TranSen : {emergencyBanner}</span>
        </div>
      )}

      {/* Main Header Row */}
      <div className="relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/55 to-transparent pointer-events-none" />

        {/* Futuristic Cyber-Emerald & Cyan Scroll Telemetry Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 origin-left z-50 shadow-[0_0_16px_rgba(34,211,238,0.8)]"
          style={{ scaleX }}
        />

        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex justify-between items-center h-[68px] lg:h-[76px] gap-2">
            {/* Brand Logo + Telemetry Wordmark */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-emerald-400 rounded-2xl shrink-0"
            >
              <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-amber-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_32px_rgba(34,211,238,0.55)] group-hover:scale-105 transition-all duration-300">
                <div className="bg-slate-950 rounded-[14px] p-1">
                  <img
                    src="/logo.png"
                    alt="TranSen Logo"
                    className="w-8 h-8 lg:w-9 lg:h-9 rounded-[10px] object-contain bg-white"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#03100b] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg lg:text-xl leading-none font-extrabold tracking-tight text-white font-display">
                    Tran<span className="text-gradient-aurora">Sen</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                    2%
                  </span>
                </div>
                <div className="text-[9.5px] text-slate-400 font-mono uppercase tracking-[0.14em] leading-none mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Mobilité Sénégal
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Pill Bar (Visible dès 1024px / lg) */}
            <nav
              className="hidden lg:flex items-center gap-0.5 p-1 rounded-full bg-white/[0.035] border border-white/[0.09] backdrop-blur-xl shadow-inner overflow-x-auto max-w-full"
              aria-label="Navigation principale"
            >
              {NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-2.5 xl:px-3 py-1.5 rounded-full text-[11.5px] xl:text-[12.5px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                      active
                        ? "text-white"
                        : "text-slate-300/90 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="aurora-nav-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-emerald-500/30 border border-emerald-400/45 shadow-[0_0_20px_rgba(16,185,129,0.28)] -z-10"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      {link.name}
                      {link.path === "/investir" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action CTAs */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/chauffeurs"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-emerald-200 bg-emerald-500/10 border border-emerald-400/30 hover:bg-emerald-500/20 hover:border-emerald-300/60 hover:text-white transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
                <span>Chauffeurs</span>
              </Link>
              <Link
                to="/contact#telecharger"
                className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2 rounded-full text-xs text-slate-950 font-extrabold transition-all duration-200 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 hover:from-amber-200 hover:to-yellow-200 shadow-[0_8px_25px_-4px_rgba(245,184,61,0.55)] hover:shadow-[0_12px_32px_-4px_rgba(245,184,61,0.8)] hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Application</span>
              </Link>
            </div>

            {/* Mobile / Tablet Menu Trigger */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-xl text-emerald-300 bg-white/[0.05] border border-white/10 hover:bg-emerald-500/15 hover:border-emerald-400/40 transition-colors cursor-pointer"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Always-Visible Compact Page Bar on Tablet & Mobile (< 1024px) */}
        <nav
          className="lg:hidden border-t border-white/[0.07] bg-[#020d09]/70 px-3 py-1.5 overflow-x-auto"
          aria-label="Accès direct pages"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex items-center gap-1.5 w-max">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-emerald-500/25 text-white border border-emerald-400/45 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "text-slate-300 bg-white/[0.03] border border-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {link.name}
                    {link.path === "/investir" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile / Tablet Full Glass Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-y-auto max-h-[calc(100vh-115px)] border-t border-emerald-500/20"
            style={{
              backgroundColor: "rgba(3, 16, 11, 0.97)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
            }}
          >
            <nav
              className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-1.5"
              aria-label="Navigation mobile complète"
            >
              {NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center justify-between py-2.5 px-4 rounded-2xl transition-all text-sm font-semibold ${
                      active
                        ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-400/35"
                        : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {link.name}
                      {link.path === "/investir" && (
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                          Phase 1
                        </span>
                      )}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${active ? "text-emerald-300" : "text-slate-600"}`} />
                  </Link>
                );
              })}

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-[11px] font-mono">
                <a
                  href="https://app.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-2 rounded-xl bg-white/[0.04] border border-emerald-400/25 text-emerald-300 text-center flex items-center justify-center gap-1"
                >
                  <span>App Web</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://compagnie.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-2 rounded-xl bg-white/[0.04] border border-cyan-400/25 text-cyan-300 text-center flex items-center justify-center gap-1"
                >
                  <span>B2B Flotte</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://investir.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-2 rounded-xl bg-white/[0.04] border border-amber-400/25 text-amber-300 text-center flex items-center justify-center gap-1"
                >
                  <span>Data Room</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
                <Link
                  to="/chauffeurs"
                  className="py-3 text-center rounded-2xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 font-bold text-sm"
                >
                  Devenir Chauffeur
                </Link>
                <Link
                  to="/contact#telecharger"
                  className="py-3 text-center rounded-2xl text-sm text-slate-950 font-extrabold bg-gradient-to-r from-amber-300 to-yellow-400 shadow-[0_8px_24px_rgba(245,184,61,0.4)]"
                >
                  Télécharger l'App
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
