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
  { value: 1, suffix: "%", label: "Taux de Commission Unique" },
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

let isInitialAppLoad = true;

const DYNAMIC_PHRASES = [
  "en toute confiance.",
  "au meilleur tarif.",
  "en toute sécurité.",
  "avec simplicité.",
  "à 1% de commission.",
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
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section
          className="relative min-h-screen flex flex-col justify-center"
          style={{
            background: "linear-gradient(135deg, #062617 0%, #0d5c2d 40%, #14A44D 100%)",
          }}
        >
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1740772205703-6ecc076c2160?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXMlMjBzZW5lZ2FsfGVufDF8fHx8MTc2MzEyNDA0NXww&ixlib=rb-4.1.0&q=80&w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Decorative dynamic floating blobs */}
        <motion.div 
          animate={{
            y: [0, -30, 20, 0],
            x: [0, 20, -15, 0],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--brand-gold) 0%, transparent 70%)", transform: "translate(30%, -20%)" }}
        />
        <motion.div 
          animate={{
            y: [0, 25, -25, 0],
            x: [0, -25, 15, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: headline with clean stagger animations */}
            <div className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 self-start font-semibold"
                style={{ backgroundColor: "rgba(255,215,0,0.15)", color: "var(--brand-gold)" }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--brand-gold)" }} />
                Commission Unique de 1% · Urbain & Interurbain 🇸🇳
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight font-extrabold tracking-tight min-h-[3.8em] sm:min-h-[3.3em] md:min-h-0"
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
                      className="absolute left-0 bottom-0 sm:relative bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent block sm:inline-block whitespace-nowrap"
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
                className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed"
              >
                TranSen connecte passagers, chauffeurs et compagnies de transport. 
                Profitez d'un <strong>taux de commission unique de 1%</strong> seulement sur vos trajets, garantissant des tarifs passagers ultra-compétitifs et des revenus maximums pour nos chauffeurs partenaires.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Link
                  to="/contact"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-gray-900 font-bold transition-all hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.04] active:scale-[0.98]"
                  style={{ backgroundColor: "var(--brand-gold)" }}
                >
                  <Download className="w-4 h-4" />
                  Télécharger l'App
                </Link>
                <Link
                  to="/chauffeurs"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold border border-white/30 hover:bg-white/10 transition-all hover:scale-[1.04] active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  Devenir Chauffeur
                </Link>
              </motion.div>

              {/* Mini stats row */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.55 }}
                className="flex gap-8"
              >
                {STATS.slice(0, 3).map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold" style={{ color: "var(--brand-gold)" }}>
                      <AnimatedCounter target={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Booking Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] transition-shadow duration-300"
            >
              <p className="text-white/60 text-xs mb-4 tracking-wider uppercase">Réserver maintenant</p>
              <TripBookingWidget />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Departures ───────────────────────────────────────────────── */}
      <LiveDepartures />

      {/* ── Explorateur Interactif d'Économie & de Réseaux ──────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
                style={{ backgroundColor: "rgba(255,215,0,0.15)", color: "var(--brand-gold)" }}
              >
                Outils de Transparence TranSen ✨
              </div>
              <h2 className="text-3xl md:text-4xl mb-4 font-extrabold text-gray-900 tracking-tight">
                Simulez vos gains et explorez nos liaisons
              </h2>
              <p className="text-gray-500 text-sm">
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
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <div className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
                style={{ backgroundColor: "rgba(20,164,77,0.1)", color: "var(--brand-green)" }}
              >
                L'écosystème TranSen
              </div>
              <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
                Trois services, une seule application
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Que vous voyagez, conduisez ou expédiez, TranSen a la solution adaptée.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10, scale: 1.02 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-gray-100/80 group cursor-pointer relative overflow-hidden"
              >
                {svc.badge && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs text-white mb-4 self-start"
                    style={{ backgroundColor: svc.color }}
                  >
                    {svc.badge}
                  </div>
                )}
                {!svc.badge && <div className="mb-4 h-6" />}

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: svc.color + "15" }}
                >
                  <svc.Icon className="w-7 h-7" style={{ color: svc.color }} />
                </div>

                <div className="text-xs mb-1 font-semibold" style={{ color: svc.color }}>{svc.tag}</div>
                <h3 className="text-xl mb-3 font-bold" style={{ color: "#1a1a1a" }}>{svc.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{svc.desc}</p>

                <ul className="space-y-2 mb-6">
                  {svc.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" style={{ color: svc.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to={svc.href}
                  className="flex items-center gap-2 text-sm mt-auto font-bold transition-all hover:gap-3"
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
                <div className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
                  style={{ backgroundColor: "rgba(20,164,77,0.1)", color: "var(--brand-green)" }}
                >
                  Pourquoi TranSen ?
                </div>
                <h2 className="text-3xl md:text-4xl mb-6" style={{ color: "var(--brand-green)" }}>
                  La mobilité interurbaine repensée pour le Sénégal
                </h2>
                <div className="space-y-6">
                  {BENEFITS.map((b, i) => (
                    <motion.div
                      key={b.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex gap-4"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--brand-green)" }}
                      >
                        <b.Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="mb-1" style={{ color: "#1a1a1a" }}>{b.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="rounded-3xl overflow-hidden shadow-2xl">
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

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #062617 0%, #14A44D 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl md:text-5xl mb-2" style={{ color: "var(--brand-gold)" }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-white/70 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ecosystem 3-sided ────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <div className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
                style={{ backgroundColor: "rgba(20,164,77,0.1)", color: "var(--brand-green)" }}
              >
                Un écosystème complet
              </div>
              <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
                TranSen fonctionne pour tout le monde
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Passagers, chauffeurs indépendants ou compagnies de transport — chacun a son espace dédié.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-8">
            {ECOSYSTEM.map((eco, i) => (
              <motion.div
                key={eco.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.015 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: eco.color + "25" }}
                >
                  <eco.Icon className="w-7 h-7" style={{ color: eco.color }} />
                </div>
                <h3 className="text-xl mb-5 font-bold" style={{ color: eco.color }}>{eco.role}</h3>
                <ol className="space-y-3">
                  {eco.steps.map((step, idx) => (
                    <li key={step} className="flex gap-3 text-sm text-gray-600">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: eco.color }}
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
              <div className="inline-block px-4 py-1.5 rounded-full text-sm mb-4"
                style={{ backgroundColor: "rgba(20,164,77,0.1)", color: "var(--brand-green)" }}
              >
                Compagnies certifiées
              </div>
              <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
                Nos compagnies partenaires
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Des transporteurs vérifiés KYC, avec chauffeurs certifiés et véhicules contrôlés.
              </p>
            </div>
          </FadeUp>
 
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PARTNERS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.95, y: 25 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.03 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-green-200 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: "var(--brand-green)" }}
                >
                  <Bus className="w-7 h-7 text-white" />
                </div>
                <div className="text-gray-900 mb-1 font-bold">{p.name}</div>
                <div className="flex items-center justify-center gap-1 text-xs mb-2">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">{p.routes}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" style={{ color: "var(--brand-gold)", fill: "var(--brand-gold)" }} />
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all hover:shadow-lg"
                style={{ borderColor: "var(--brand-green)", color: "var(--brand-green)" }}
              >
                Voir toutes nos compagnies <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Payment Methods ──────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-10">
              <p className="text-gray-400 text-sm mb-4 tracking-wider uppercase">Paiements acceptés via SenePay</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.name}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: pm.color }}
                    >
                      {pm.name[0]}
                    </div>
                    <div>
                      <div className="text-sm text-gray-800">{pm.name}</div>
                      <div className="text-xs text-gray-400">{pm.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── App Download CTA ─────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #062617 0%, #0d5c2d 50%, #14A44D 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <div>
                <h2 className="text-3xl md:text-4xl text-white mb-5">
                  Téléchargez l'application<br />
                  <span style={{ color: "var(--brand-gold)" }}>TranSen dès maintenant</span>
                </h2>
                <p className="text-white/70 mb-8 leading-relaxed">
                  Disponible en APK pour Android. Réservez vos trajets, gérez vos courses
                  et suivez vos colis depuis votre mobile.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/contact"
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl transition-all hover:shadow-xl hover:scale-[1.02]"
                    style={{ backgroundColor: "var(--brand-gold)", color: "#111" }}
                  >
                    <Download className="w-5 h-5" />
                    <div>
                      <div className="text-xs opacity-70">Télécharger l'APK</div>
                      <div>Android</div>
                    </div>
                  </Link>
                  <Link
                    to="/chauffeurs"
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/30 text-white hover:bg-white/10 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <div>
                      <div className="text-xs opacity-70">Rejoignez-nous</div>
                      <div>Devenir chauffeur</div>
                    </div>
                  </Link>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="flex justify-center">
                <div
                  className="w-64 h-64 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    background: "radial-gradient(circle at 40% 40%, rgba(255,215,0,0.3), rgba(20,164,77,0.4))",
                    border: "2px solid rgba(255,215,0,0.3)"
                  }}
                >
                  <div className="text-center">
                    <Smartphone className="w-20 h-20 text-white/60 mx-auto mb-3" />
                    <div className="text-white/70 text-sm">Application mobile</div>
                    <div style={{ color: "var(--brand-gold)" }} className="text-xs mt-1">Android APK</div>
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
