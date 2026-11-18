import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { IntroCarLoader } from "../components/IntroCarLoader";
import {
  Shield, Zap, Users, Download, UserPlus, Bus, Car, Package,
  ArrowRight, CheckCircle, MapPin, Smartphone, Building2, Star, ChevronRight, Play
} from "lucide-react";
import { TripBookingWidget } from "../components/TripBookingWidget";
import { LiveDepartures } from "../components/LiveDepartures";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { CommissionCalculator, SenegalRouteMap } from "../components/InteractiveShowcase";

const STATS = [
  { value: 2, suffix: "%", label: "Taux de Commission Unique" },
  { value: 10000, suffix: "+", label: "Voyageurs satisfaits" },
  { value: 14, suffix: "", label: "Régions desservies" },
  { value: 200, suffix: "+", label: "Chauffeurs partenaires" },
];

const BENEFITS = [
  { Icon: Shield, title: "Sécurité garantie", desc: "Chauffeurs vérifiés, véhicules certifiés, assurance incluse pour chaque trajet." },
  { Icon: Zap, title: "Paiement instantané", desc: "Wave, Orange Money, Free Money — payez en ligne en quelques secondes via SenePay." },
  { Icon: Users, title: "Pour tous", desc: "Passagers, chauffeurs indépendants ou compagnies : un écosystème pensé pour chacun." },
];

const SERVICES = [
  {
    Icon: Bus,
    id: "bus_company",
    tag: "Compagnies Partenaires",
    title: "Voyages Interurbains",
    desc: "Réservez votre siège sur un bus d'une compagnie partenaire certifiée. Horaires fixes, paiement SenePay en ligne et ticket QR à scanner à bord.",
    features: ["Sélection de siège interactive", "Paiement en ligne SenePay", "Ticket QR Code d'embarquement", "Suivi GPS temps réel"],
    color: "#14A44D",
    badge: "Le plus populaire",
    href: "/services",
  },
  {
    Icon: Car,
    id: "allo_dakar",
    tag: "Allô Dakar",
    title: "Course VTC Directe",
    desc: "Un chauffeur indépendant proche de vous, disponible immédiatement pour votre trajet. Paiement à bord en espèces ou Mobile Money.",
    features: ["Départ immédiat", "1 à 4 passagers", "Chauffeurs évalués", "Paiement à bord"],
    color: "#1a7a40",
    badge: null,
    href: "/services",
  },
  {
    Icon: Package,
    id: "yobante",
    tag: "Yobante",
    title: "Envoi de Colis",
    desc: "Envoyez vos colis d'une région à l'autre en toute sécurité. Suivi en temps réel, assurance incluse et confirmation de réception.",
    features: ["Suivi de colis en direct", "Assurance incluse", "Livraison interurbaine", "Tarifs compétitifs"],
    color: "#cc8800",
    badge: null,
    href: "/services",
  },
];

const ECOSYSTEM = [
  {
    role: "Passagers",
    Icon: Users,
    color: "#14A44D",
    steps: [
      "Téléchargez l'application TranSen",
      "Choisissez votre destination et date",
      "Sélectionnez votre siège et payez en ligne",
      "Voyagez avec votre QR code d'embarquement",
    ],
  },
  {
    role: "Chauffeurs",
    Icon: Car,
    color: "#FFD700",
    steps: [
      "Inscrivez-vous et faites vérifier votre profil",
      "Rejoignez une compagnie ou travaillez en indépendant",
      "Acceptez des courses et gérez vos plannings",
      "Recevez vos gains via Wave ou Orange Money",
    ],
  },
  {
    role: "Compagnies",
    Icon: Building2,
    color: "#1a7a40",
    steps: [
      "Créez votre espace compagnie et soumettez vos documents KYC",
      "Ajoutez vos chauffeurs avec votre code d'accès unique",
      "Planifiez vos axes de voyage et horaires",
      "Gérez réservations et revenus depuis le panel web",
    ],
  },
];

const PARTNERS = [
  { name: "MACHALLA Transport", routes: "Dakar – Saint-Louis", rating: 4.8, trips: "1 200+" },
  { name: "TranSen Express", routes: "Dakar – Kaolack", rating: 4.9, trips: "850+" },
  { name: "Sénégal Voyages", routes: "Dakar – Ziguinchor", rating: 4.7, trips: "640+" },
  { name: "Dakar Bus VIP", routes: "Dakar – Tambacounda", rating: 5.0, trips: "320+" },
];

const PAYMENT_METHODS = [
  { name: "Wave", color: "#00B9FF", desc: "Paiement instantané" },
  { name: "Orange Money", color: "#FF6600", desc: "Transfert sécurisé" },
  { name: "Free Money", color: "#9b2be0", desc: "Rapide et fiable" },
];

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

let isInitialAppLoad = (() => {
  try {
    if (typeof window !== "undefined") {
      return !window.sessionStorage.getItem("transen_intro_seen");
    }
  } catch {
    return false;
  }
  return false;
})();

const DYNAMIC_PHRASES = [
  "en toute confiance.",
  "au meilleur tarif.",
  "en toute sécurité.",
  "avec simplicité.",
  "à 2% de commission.",
  "sans aucun stress."
];

export function Home() {
  const [showIntro, setShowIntro] = useState(isInitialAppLoad);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % DYNAMIC_PHRASES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleIntroComplete = useCallback(() => {
    isInitialAppLoad = false;
    try {
      window.sessionStorage.setItem("transen_intro_seen", "1");
    } catch {
      // Ignore storage errors
    }
    setShowIntro(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <IntroCarLoader onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: showIntro ? 0.4 : 0 }}
        className="relative"
      >
        {/* ── Hero Futuriste Cyber-Émeraude ─────────────────────────────────── */}
        <section
          className="relative min-h-screen flex flex-col justify-center overflow-hidden"
          style={{
            background: "radial-gradient(circle at 20% 15%, #073826 0%, #03150e 45%, #020908 100%)",
          }}
        >
        {/* Background photo subtle blend + Cyber-Grid */}
        <div className="absolute inset-0 opacity-12 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1740772205703-6ecc076c2160?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXMlMjBzZW5lZ2FsfGVufDF8fHx8MTc2MzEyNDA0NXww&ixlib=rb-4.1.0&q=80&w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="cyber-grid absolute inset-0 opacity-75 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020908]/80 pointer-events-none" />

        {/* Dynamic Glowing Aerospace Blobs */}
        <motion.div
          animate={{
            y: [0, -24, 16, 0],
            x: [0, 18, -12, 0],
            scale: [1, 1.1, 0.96, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 right-0 w-[440px] h-[440px] rounded-full opacity-25 pointer-events-none will-change-transform"
          style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.55) 0%, rgba(16, 185, 129, 0.25) 45%, transparent 72%)", transform: "translate(25%, -15%)" }}
        />
        <motion.div
          animate={{
            y: [0, 22, -20, 0],
            x: [0, -20, 14, 0],
            scale: [1, 0.92, 1.08, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none will-change-transform"
          style={{ background: "radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, transparent 70%)", transform: "translate(-25%, 25%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: futuristic typography + telemetry CTA */}
            <div className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs sm:text-sm mb-6 self-start font-bold border border-emerald-400/35 bg-emerald-950/60 backdrop-blur-md text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Commission Unique de 2% · Urbain & Interurbain 🇸🇳</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-[1.12] font-extrabold tracking-tight min-h-[3.8em] sm:min-h-[3.3em] md:min-h-0"
              >
                Voyagez partout<br />
                au Sénégal,<br />
                <span className="inline-block relative overflow-hidden h-[1.3em] w-full sm:w-auto align-bottom">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={phraseIndex}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 bottom-0 sm:relative bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent block sm:inline-block whitespace-nowrap"
                    >
                      {DYNAMIC_PHRASES[phraseIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed"
              >
                TranSen connecte passagers, chauffeurs et compagnies de transport sur une infrastructure temps réel.
                Profitez d'un <strong className="text-amber-300 font-bold">taux de commission unique de 2%</strong>, garantissant des tarifs justes et des revenus maximums pour nos partenaires.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap gap-3.5 mb-10"
              >
                <Link
                  to="/contact"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-slate-950 font-extrabold transition-all bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.45)] hover:shadow-[0_14px_34px_-5px_rgba(245,158,11,0.65)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Download className="w-4 h-4" />
                  Télécharger l'App
                </Link>
                <Link
                  to="/chauffeurs"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold border border-emerald-400/35 bg-white/5 backdrop-blur-md hover:bg-emerald-500/15 hover:border-cyan-400/60 transition-all hover:-translate-y-0.5"
                >
                  <UserPlus className="w-4 h-4 text-cyan-300" />
                  Devenir Chauffeur
                </Link>
              </motion.div>

              {/* Mini telemetry stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.55 }}
                className="grid grid-cols-3 gap-4 sm:gap-8 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md max-w-lg"
              >
                {STATS.slice(0, 3).map(s => (
                  <div key={s.label}>
                    <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">
                      <AnimatedCounter target={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Futuristic Glassmorphism Booking Terminal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl p-[1.5px] bg-gradient-to-br from-emerald-400/60 via-cyan-400/40 to-amber-400/50 shadow-[0_25px_70px_-15px_rgba(6,182,212,0.3)]"
            >
              <div className="bg-slate-950/75 backdrop-blur-2xl rounded-[calc(1.5rem-1.5px)] p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Terminal Réservation Directe
                  </p>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                    SENEPAY READY
                  </span>
                </div>
                <TripBookingWidget />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Departures ───────────────────────────────────────────────── */}
      <LiveDepartures />

      {/* ── Explorateur Interactif d'Économie & de Réseaux ──────────────────── */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 bg-amber-500/12 text-amber-800 border border-amber-500/25">
                Outils de Transparence TranSen ✨
              </div>
              <h2 className="text-3xl md:text-4xl mb-4 font-extrabold text-slate-900 tracking-tight">
                Simulez vos gains et explorez nos liaisons
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Révolutionner le transport veut aussi dire donner aux acteurs locaux le contrôle total des données de tarification et de rentabilité.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 gap-12">
            <FadeUp delay={0.1}>
              <CommissionCalculator />
            </FadeUp>

            <FadeUp delay={0.2}>
              <SenegalRouteMap />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── 3 Services ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                L'écosystème TranSen
              </div>
              <h2 className="text-3xl md:text-4xl mb-4 font-extrabold text-slate-900 tracking-tight">
                Trois services, <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">une seule plateforme</span>
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Que vous voyagiez, conduisiez ou expédiiez, TranSen offre l'expérience la plus fluide du Sénégal.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-950/10 transition-all duration-200 h-full flex flex-col border border-slate-200/80 hover:border-emerald-400/50 group relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {svc.badge && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4 self-start shadow-sm"
                    style={{ backgroundColor: svc.color }}
                  >
                    {svc.badge}
                  </div>
                )}
                {!svc.badge && <div className="mb-4 h-6" />}

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: svc.color + "18" }}
                >
                  <svc.Icon className="w-7 h-7" style={{ color: svc.color }} />
                </div>

                <div className="text-xs mb-1 font-bold uppercase tracking-wider" style={{ color: svc.color }}>{svc.tag}</div>
                <h3 className="text-xl mb-3 font-extrabold text-slate-900">{svc.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">{svc.desc}</p>

                <ul className="space-y-2 mb-6">
                  {svc.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: svc.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={svc.href}
                  className="inline-flex items-center gap-2 text-sm mt-auto font-bold transition-all hover:gap-3"
                  style={{ color: svc.color }}
                >
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <div>
                <div className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                  Pourquoi TranSen ?
                </div>
                <h2 className="text-3xl md:text-4xl mb-6 font-extrabold text-slate-900 tracking-tight">
                  La mobilité interurbaine repensée pour le Sénégal
                </h2>
                <div className="space-y-6">
                  {BENEFITS.map((b, i) => (
                    <motion.div
                      key={b.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.45 }}
                      className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg shadow-emerald-600/20">
                        <b.Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="mb-1 font-bold text-slate-900">{b.title}</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">{b.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-emerald-950/10">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=800"
                  alt="Transport sécurisé au Sénégal"
                  className="w-full h-96 object-cover"
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Stats Futuristes ────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "radial-gradient(circle at 50% 0%, #093b2a 0%, #03150e 65%, #020908 100%)" }}>
        <div className="cyber-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white/[0.04] border border-emerald-400/20 backdrop-blur-md"
              >
                <div className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 bg-clip-text text-transparent">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-slate-300 text-xs sm:text-sm font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ecosystem 3-sided ────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                Un écosystème complet
              </div>
              <h2 className="text-3xl md:text-4xl mb-4 font-extrabold text-slate-900 tracking-tight">
                TranSen fonctionne pour tout le monde
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Passagers, chauffeurs indépendants ou compagnies de transport — chacun dispose d'un espace dédié haute performance.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-8">
            {ECOSYSTEM.map((eco, i) => (
              <motion.div
                key={eco.role}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 h-full hover:shadow-2xl hover:border-emerald-400/50 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: eco.color === "#FFD700" ? "rgba(245,158,11,0.16)" : eco.color + "18" }}
                >
                  <eco.Icon className="w-7 h-7" style={{ color: eco.color === "#FFD700" ? "#B45309" : eco.color }} />
                </div>
                <h3 className="text-xl mb-5 font-extrabold" style={{ color: eco.color === "#FFD700" ? "#B45309" : eco.color }}>{eco.role}</h3>
                <ol className="space-y-3">
                  {eco.steps.map((step, idx) => (
                    <li key={step} className="flex gap-3 text-sm text-slate-700">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-white"
                        style={{ backgroundColor: eco.color === "#FFD700" ? "#D97706" : eco.color }}
                      >
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <div className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                Compagnies certifiées
              </div>
              <h2 className="text-3xl md:text-4xl mb-4 font-extrabold text-slate-900 tracking-tight">
                Nos compagnies partenaires
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Des transporteurs vérifiés KYC, avec chauffeurs certifiés et véhicules contrôlés.
              </p>
            </div>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PARTNERS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ y: -6 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/80 hover:bg-white hover:shadow-xl hover:border-emerald-400/50 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg shadow-emerald-600/20 transition-transform duration-200 group-hover:scale-110">
                  <Bus className="w-7 h-7 text-white" />
                </div>
                <div className="text-slate-900 mb-1 font-bold">{p.name}</div>
                <div className="flex items-center justify-center gap-1 text-xs mb-2 text-slate-600">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{p.routes}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {p.rating}
                  </span>
                  <span>{p.trips} trajets</span>
                </div>
              </motion.div>
            ))}
          </div>

          <FadeUp delay={0.3}>
            <div className="text-center mt-10">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-emerald-600 text-emerald-700 font-bold hover:bg-emerald-50 transition-all hover:shadow-lg"
              >
                Voir toutes nos compagnies <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Payment Methods ──────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center">
              <p className="text-slate-500 text-xs font-mono font-bold mb-5 tracking-widest uppercase">Paiements instantanés via SenePay</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.name}
                    className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-sm"
                      style={{ backgroundColor: pm.color }}
                    >
                      {pm.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-900">{pm.name}</div>
                      <div className="text-xs text-slate-500">{pm.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── App Download CTA Futuriste ───────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "radial-gradient(circle at 80% 20%, #093b2a 0%, #03150e 60%, #020908 100%)" }}>
        <div className="cyber-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
                  Téléchargez l'application<br />
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 bg-clip-text text-transparent">TranSen dès maintenant</span>
                </h2>
                <p className="text-slate-300 mb-8 leading-relaxed">
                  Disponible en APK pour Android. Réservez vos trajets, gérez vos courses
                  et suivez vos colis depuis votre mobile avec une sécurité bancaire temps réel.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/contact"
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_10px_28px_-5px_rgba(245,158,11,0.45)] transition-all hover:shadow-[0_14px_34px_-5px_rgba(245,158,11,0.65)] hover:-translate-y-0.5"
                  >
                    <Download className="w-5 h-5" />
                    <div>
                      <div className="text-xs opacity-75">Télécharger l'APK</div>
                      <div>Android Mobile</div>
                    </div>
                  </Link>
                  <Link
                    to="/chauffeurs"
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-emerald-400/35 bg-white/5 backdrop-blur-md text-white font-bold hover:bg-emerald-500/15 hover:border-cyan-400/50 transition-all hover:-translate-y-0.5"
                  >
                    <UserPlus className="w-5 h-5 text-cyan-300" />
                    <div>
                      <div className="text-xs text-slate-300">Rejoignez-nous</div>
                      <div>Devenir chauffeur</div>
                    </div>
                  </Link>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="flex justify-center">
                <div
                  className="w-64 h-64 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.25)] relative"
                  style={{
                    background: "radial-gradient(circle at 40% 40%, rgba(6,182,212,0.22), rgba(16,185,129,0.25) 60%, rgba(2,9,8,0.9))",
                    border: "1.5px solid rgba(52,211,153,0.4)"
                  }}
                >
                  <div className="text-center">
                    <Smartphone className="w-20 h-20 text-emerald-300 mx-auto mb-3" />
                    <div className="text-white font-bold text-sm">Application mobile</div>
                    <div className="text-amber-300 font-mono text-xs mt-1">Android APK · v2.0</div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
    </motion.div>
  </>
  );
}
