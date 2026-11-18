import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { IntroCarLoader } from "../components/IntroCarLoader";
import {
  Shield, Zap, Users, Download, UserPlus, Bus, Car, Package,
  ArrowRight, CheckCircle, MapPin, Smartphone, Building2, Star, ChevronRight,
  Sparkles, QrCode, Radio, Globe, Lock
} from "lucide-react";
import { TripBookingWidget } from "../components/TripBookingWidget";
import { LiveDepartures } from "../components/LiveDepartures";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { CommissionCalculator, SenegalRouteMap } from "../components/InteractiveShowcase";
import { Reveal, SpotlightCard, SectionHeader } from "../components/fx";

const STATS = [
  { value: 2, suffix: "%", label: "Taux de Commission Unique" },
  { value: 10000, suffix: "+", label: "Voyageurs satisfaits" },
  { value: 14, suffix: "", label: "Régions desservies" },
  { value: 200, suffix: "+", label: "Chauffeurs partenaires" },
];

const BENEFITS = [
  {
    Icon: Shield,
    tag: "KYC & SÛRETÉ",
    title: "Sécurité & Conformité Garantie",
    desc: "Chauffeurs vérifiés KYC, véhicules contrôlés, billet QR Code nominatif et traçabilité GPS sur chaque axe.",
  },
  {
    Icon: Zap,
    tag: "SENEPAY INSTANTANÉ",
    title: "Paiement Mobile Money en 3 Secondes",
    desc: "Wave, Orange Money et Free Money intégrés nativement via SenePay avec confirmation temps réel.",
  },
  {
    Icon: Users,
    tag: "ÉQUité 98% / 2%",
    title: "98% Reversés aux Transporteurs",
    desc: "La commission la plus basse d'Afrique de l'Ouest (2%) pour maximiser le revenu des chauffeurs et compagnies.",
  },
];

const SERVICES = [
  {
    Icon: Bus,
    id: "bus_company",
    tag: "Compagnies Partenaires",
    title: "Voyages Interurbains",
    desc: "Réservez votre siège exact sur un autocar ou minibus d'une compagnie certifiée. Horaires garantis, paiement SenePay et billet QR à scanner à bord.",
    features: ["Plan de siège interactif", "Paiement en ligne SenePay", "Ticket QR Code d'embarquement", "Suivi GPS temps réel"],
    accent: "from-emerald-400 to-teal-300",
    glow: "rgba(16, 185, 129, 0.25)",
    badge: "Le plus populaire",
    href: "/services",
  },
  {
    Icon: Car,
    id: "allo_dakar",
    tag: "Allô Dakar · VTC",
    title: "Course Urbaine Directe",
    desc: "Un chauffeur indépendant vérifié proche de votre position, disponible immédiatement à Dakar et dans les capitales régionales.",
    features: ["Départ immédiat 24/7", "1 à 4 passagers climatisé", "Tarif transparent à l'avance", "Paiement espèces ou Mobile Money"],
    accent: "from-cyan-400 to-sky-300",
    glow: "rgba(34, 211, 238, 0.25)",
    badge: "Temps Réel",
    href: "/services",
  },
  {
    Icon: Package,
    id: "yobante",
    tag: "Yobanté · Logistique",
    title: "Expédition de Colis",
    desc: "Expédiez vos colis et plis urgents entre les 14 régions du Sénégal. Traçabilité de gare en gare, code secret de remise et assurance.",
    features: ["Suivi de colis en direct", "Code de remise sécurisé", "Livraison interurbaine J+0", "Tarifs ultra-compétitifs"],
    accent: "from-amber-300 to-yellow-400",
    glow: "rgba(245, 184, 61, 0.25)",
    badge: "Fret Express",
    href: "/services",
  },
];

const ECOSYSTEM = [
  {
    role: "Passagers & Clients",
    subtitle: "Mobilité sans friction",
    Icon: Users,
    accent: "text-emerald-300",
    badgeBg: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
    ctaText: "Explorer les services",
    ctaHref: "/services",
    steps: [
      "Ouvrez TranSen Web ou téléchargez l'application Android",
      "Choisissez votre liaison interurbaine, VTC ou envoi Yobanté",
      "Sélectionnez votre siège et réglez en 1 clic via Wave / OM / Free",
      "Embarquez instantanément avec votre Pass QR chiffré",
    ],
  },
  {
    role: "Chauffeurs Partenaires",
    subtitle: "98% du chiffre d'affaires conservé",
    Icon: Car,
    accent: "text-amber-300",
    badgeBg: "bg-amber-500/20 border-amber-400/40 text-amber-300",
    ctaText: "Devenir Chauffeur",
    ctaHref: "/chauffeurs",
    steps: [
      "Inscrivez-vous en ligne et validez votre profil KYC en 24h",
      "Activez votre radar Allô Dakar ou rejoignez une flotte affiliée",
      "Acceptez courses et colis selon votre propre planning",
      "Encaissez vos revenus instantanément sur Wave ou Orange Money",
    ],
  },
  {
    role: "Compagnies & Flottes B2B",
    subtitle: "Console de pilotage temps réel",
    Icon: Building2,
    accent: "text-cyan-300",
    badgeBg: "bg-cyan-500/20 border-cyan-400/40 text-cyan-300",
    ctaText: "Découvrir l'Espace B2B",
    ctaHref: "/compagnies",
    steps: [
      "Activez votre Portail Compagnie dédié (compagnie.transen.org)",
      "Enrôlez vos bus, minibus et chauffeurs avec code sécurisé",
      "Automatisez la billetterie QR, le remplissage et la comptabilité",
      "Pilotez votre trésorerie en direct avec seulement 2% de commission",
    ],
  },
];

const PARTNERS = [
  { name: "MACHALLA Transport", routes: "Dakar – Saint-Louis", rating: 4.8, trips: "1 200+" },
  { name: "TranSen Express", routes: "Dakar – Kaolack – Touba", rating: 4.9, trips: "850+" },
  { name: "Sénégal Voyages", routes: "Dakar – Ziguinchor", rating: 4.7, trips: "640+" },
  { name: "Dakar Bus VIP", routes: "Dakar – Tambacounda", rating: 5.0, trips: "320+" },
];

const PAYMENT_METHODS = [
  { name: "Wave Sénégal", tag: "INSTANTANÉ", color: "#00B9FF", desc: "Paiement mobile 0 friction" },
  { name: "Orange Money", tag: "CERTIFIÉ", color: "#FF6600", desc: "Validation USSD & App directe" },
  { name: "Free Money", tag: "SÉCURISÉ", color: "#e11d48", desc: "Règlement rapide multi-régions" },
  { name: "Pass QR SenePay", tag: "CHIFFRÉ AES-256", color: "#10B981", desc: "Billet numérique infalsifiable" },
];

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
  "sans aucun stress.",
];

export function Home() {
  const [showIntro, setShowIntro] = useState(isInitialAppLoad);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % DYNAMIC_PHRASES.length);
    }, 3800);
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
        {showIntro && <IntroCarLoader onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: showIntro ? 0.35 : 0 }}
        className="relative"
      >
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO FUTURISTE "TERANGA AURORA"
           ══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[calc(100vh-76px)] flex flex-col justify-center overflow-hidden aurora-bg noise py-14 lg:py-20">
          {/* Background imagery + radial cyber-grid */}
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1740772205703-6ecc076c2160?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXMlMjBzZW5lZ2FsfGVufDF8fHx8MTc2MzEyNDA0NXww&ixlib=rb-4.1.0&q=80&w=1920"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid-fade absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#03100b]/40 via-transparent to-[#03100b] pointer-events-none" />

          {/* Dynamic Aurora Orbs */}
          <motion.div
            animate={{ y: [0, -28, 16, 0], x: [0, 22, -14, 0], scale: [1, 1.12, 0.95, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="orb w-[520px] h-[520px] -top-24 -right-24 opacity-40"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(16,185,129,0.25) 50%, transparent 72%)" }}
          />
          <motion.div
            animate={{ y: [0, 24, -18, 0], x: [0, -20, 14, 0], scale: [1, 0.94, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="orb w-[460px] h-[460px] -bottom-24 -left-24 opacity-35"
            style={{ background: "radial-gradient(circle, rgba(245,184,61,0.45) 0%, rgba(16,185,129,0.18) 55%, transparent 72%)" }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Visionary Display + Telemetry */}
              <div className="lg:col-span-7 flex flex-col">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-wrap items-center gap-2.5 mb-6"
                >
                  <span className="eyebrow">
                    Commission Unique 2% · Urbain & Interurbain 🇸🇳
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-3 h-3" /> 98% Reversés
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="text-4xl sm:text-5xl xl:text-[3.9rem] text-white mb-6 leading-[1.06] font-extrabold tracking-tight font-display"
                >
                  Voyagez partout
                  <br />
                  au Sénégal,
                  <br />
                  <span className="inline-block relative overflow-hidden h-[1.22em] w-full align-bottom mt-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={phraseIndex}
                        initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -30, filter: "blur(6px)" }}
                        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 bottom-0 text-gradient-animated block whitespace-nowrap"
                      >
                        {DYNAMIC_PHRASES[phraseIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-base sm:text-lg text-slate-300/95 mb-8 max-w-xl leading-relaxed"
                >
                  La première super-infrastructure sénégalaise qui réunit{" "}
                  <strong className="text-white font-semibold">autocars interurbains</strong>,{" "}
                  <strong className="text-cyan-300 font-semibold">VTC Allô Dakar</strong> et{" "}
                  <strong className="text-amber-300 font-semibold">colis Yobanté</strong>.{" "}
                  Tarifs ultra-compétitifs grâce à notre commission plafonnée à{" "}
                  <span className="text-emerald-300 font-bold underline decoration-emerald-400/50 underline-offset-4">
                    2% seulement
                  </span>
                  .
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-wrap gap-3.5 mb-10"
                >
                  <Link to="/contact" className="btn-gold text-sm sm:text-base">
                    <Download className="w-4 h-4" />
                    <span>Télécharger l'App Android</span>
                  </Link>
                  <Link to="/chauffeurs" className="btn-ghost text-sm sm:text-base">
                    <UserPlus className="w-4 h-4 text-cyan-300" />
                    <span>Devenir Chauffeur (98%)</span>
                  </Link>
                  <Link
                    to="/investir"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/35 hover:bg-amber-400/20 transition-all"
                  >
                    <span>Investir dès 500 FCFA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>

                {/* Futuristic Telemetry HUD Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.45 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl glass max-w-2xl"
                >
                  {STATS.map((s) => (
                    <div key={s.label} className="px-2">
                      <div className="text-2xl sm:text-3xl font-extrabold font-display text-gradient-gold">
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                      </div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300/85 mt-1 leading-snug">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Column: Animated Conic-Border Glass Booking Terminal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5"
              >
                <div className="gradient-border rounded-[28px] shadow-[0_30px_90px_-20px_rgba(16,185,129,0.4)]">
                  <div className="glass-strong rounded-[28px] p-5 sm:p-6 relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-400/15 blur-3xl" />
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                        </span>
                        <span className="text-cyan-300 text-xs font-mono font-bold tracking-[0.16em] uppercase">
                          Terminal Réservation Directe
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/35">
                        SENEPAY 2%
                      </span>
                    </div>
                    <TripBookingWidget />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            2. LIVE DEPARTURES TELEMETRY RIBBON
           ══════════════════════════════════════════════════════════════════ */}
        <LiveDepartures />

        {/* ══════════════════════════════════════════════════════════════════
            3. 3 SERVICES — 3D SPOTLIGHT CARDS
           ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 section-dark relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <SectionHeader
              eyebrow="Super-App de Mobilité Nationale"
              title="Trois moteurs,"
              highlight="une seule architecture"
              subtitle="Voyagez entre les 14 régions, commandez un VTC immédiat ou expédiez vos colis avec une fluidité et une transparence inédites au Sénégal."
            />

            <div className="grid md:grid-cols-3 gap-7">
              {SERVICES.map((svc, i) => (
                <Reveal key={svc.id} delay={i * 0.1}>
                  <SpotlightCard
                    tilt
                    className="p-7 sm:p-8 h-full flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="icon-tile group-hover:scale-110 transition-transform duration-300">
                          <svc.Icon className="w-6 h-6 text-emerald-300" />
                        </div>
                        {svc.badge && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-white/[0.06] text-amber-300 border border-amber-400/30">
                            {svc.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-cyan-300 mb-1.5">
                        {svc.tag}
                      </div>
                      <h3 className="text-2xl font-extrabold text-white mb-3 font-display">
                        {svc.title}
                      </h3>
                      <p className="text-slate-300/90 text-sm leading-relaxed mb-6">
                        {svc.desc}
                      </p>

                      <ul className="space-y-2.5 mb-8">
                        {svc.features.map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={svc.href}
                      className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-bold text-emerald-300 group-hover:bg-emerald-500/15 group-hover:border-emerald-400/40 group-hover:text-white transition-all"
                    >
                      <span>Explorer ce service</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. SIMULATEUR DE GAINS & RADAR SATELLITE SÉNÉGAL
           ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 section-alt relative overflow-hidden">
          <div className="grid-fade absolute inset-0 opacity-40 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 relative z-10">
            <SectionHeader
              eyebrow="Transparence & Télémétrie Temps Réel"
              title="Simulez vos revenus &"
              highlight="explorez notre réseau"
              gold
              subtitle="Donner le pouvoir aux acteurs du transport sénégalais commence par une transparence totale sur les coûts et les flux interurbains."
            />

            <Reveal delay={0.08}>
              <CommissionCalculator />
            </Reveal>

            <Reveal delay={0.16}>
              <SenegalRouteMap />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            5. POURQUOI TRANSEN — BENTO ARCHITECTURE & VISUAL HUD
           ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 section-dark relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <Reveal>
                  <span className="eyebrow">Ingénierie & Souveraineté</span>
                  <h2 className="display-lg text-white mt-5">
                    La mobilité africaine{" "}
                    <span className="text-gradient-aurora">propulsée dans le futur</span>
                  </h2>
                  <p className="text-slate-300/90 text-base leading-relaxed mt-4">
                    Conçue à Dakar pour répondre aux réalités du terrain, TranSen combine sécurité cryptographique, paiement Mobile Money instantané et justice économique.
                  </p>
                </Reveal>

                <div className="space-y-4">
                  {BENEFITS.map((b, i) => (
                    <Reveal key={b.title} delay={i * 0.1}>
                      <SpotlightCard className="p-5 sm:p-6">
                        <div className="flex gap-4 items-start">
                          <div className="icon-tile shrink-0">
                            <b.Icon className="w-6 h-6 text-emerald-300" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300 font-bold">
                              {b.tag}
                            </span>
                            <h4 className="text-lg font-extrabold text-white mt-0.5 font-display">
                              {b.title}
                            </h4>
                            <p className="text-slate-300/90 text-sm leading-relaxed mt-1.5">
                              {b.desc}
                            </p>
                          </div>
                        </div>
                      </SpotlightCard>
                    </Reveal>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6">
                <Reveal delay={0.15}>
                  <div className="gradient-border rounded-3xl p-1.5 shadow-[0_30px_80px_-20px_rgba(16,185,129,0.35)]">
                    <div className="relative rounded-[22px] overflow-hidden bg-[#061810]">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=900"
                        alt="Transport sécurisé au Sénégal"
                        className="w-full h-[460px] object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#03100b] via-[#03100b]/35 to-transparent" />

                      {/* Floating Holographic HUD Overlay */}
                      <div className="absolute bottom-5 inset-x-5 p-5 rounded-2xl glass-strong">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                              <QrCode className="w-6 h-6 text-emerald-300" />
                            </div>
                            <div>
                              <div className="text-xs font-mono text-emerald-300 uppercase tracking-wider font-bold">
                                PASS D'EMBARQUEMENT CERTIFIÉ
                              </div>
                              <div className="text-white font-extrabold text-sm sm:text-base font-display">
                                Billetterie QR & Reversement Automatique 98%
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            AES-256 · CNDP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            6. ÉCOSYSTÈME 3 PILIERS (PASSAGERS · CHAUFFEURS · COMPAGNIES)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 section-alt relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Architecture Tripartite"
              title="Un écosystème conçu pour"
              highlight="chaque acteur"
              subtitle="Passagers, chauffeurs indépendants et compagnies de transport disposent chacun d'une interface dédiée haute performance."
            />

            <div className="grid md:grid-cols-3 gap-7">
              {ECOSYSTEM.map((eco, i) => (
                <Reveal key={eco.role} delay={i * 0.1}>
                  <SpotlightCard tilt className="p-7 sm:p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="icon-tile">
                          <eco.Icon className={`w-6 h-6 ${eco.accent}`} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${eco.badgeBg}`}>
                          0{i + 1} · PORTAIL
                        </span>
                      </div>
                      <h3 className={`text-2xl font-extrabold font-display ${eco.accent}`}>
                        {eco.role}
                      </h3>
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1 mb-6">
                        {eco.subtitle}
                      </p>

                      <ol className="space-y-3.5 mb-8">
                        {eco.steps.map((step, idx) => (
                          <li key={step} className="flex gap-3 text-sm text-slate-200/95">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Link
                      to={eco.ctaHref}
                      className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-bold text-white hover:bg-emerald-500/15 hover:border-emerald-400/40 transition-all"
                    >
                      <span>{eco.ctaText}</span>
                      <ChevronRight className="w-4 h-4 text-emerald-300" />
                    </Link>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            7. COMPAGNIES PARTENAIRES & SENEPAY MOBILE MONEY
           ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 section-dark relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Réseau National Vérifié KYC"
              title="Nos compagnies &"
              highlight="passerelles de paiement"
              subtitle="Des transporteurs sénégalais certifiés et une interconnexion native avec Wave, Orange Money et Free Money."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {PARTNERS.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.08}>
                  <SpotlightCard tilt className="p-6 text-center h-full flex flex-col justify-between">
                    <div>
                      <div className="icon-tile mx-auto mb-4">
                        <Bus className="w-6 h-6 text-emerald-300" />
                      </div>
                      <div className="text-white font-extrabold text-lg font-display mb-1">
                        {p.name}
                      </div>
                      <div className="inline-flex items-center justify-center gap-1.5 text-xs font-mono text-cyan-300 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{p.routes}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1 font-bold text-amber-300">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {p.rating}
                      </span>
                      <span className="text-emerald-300">{p.trips} trajets</span>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>

            {/* SenePay Methods Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PAYMENT_METHODS.map((pm, idx) => (
                <Reveal key={pm.name} delay={idx * 0.06}>
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl glass hover:border-emerald-400/40 transition-all">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-extrabold font-display shrink-0 shadow-lg"
                      style={{ backgroundColor: pm.color }}
                    >
                      {pm.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                        {pm.tag}
                      </div>
                      <div className="text-sm font-bold text-white truncate">{pm.name}</div>
                      <div className="text-xs text-slate-400 truncate">{pm.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            8. APP DOWNLOAD CTA — HOLOGRAPHIC SMARTPHONE COCKPIT
           ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 relative overflow-hidden aurora-bg noise border-t border-white/10">
          <div className="grid-fade absolute inset-0 opacity-60 pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="gradient-border rounded-[32px]">
              <div className="glass-strong rounded-[32px] p-8 sm:p-12 lg:p-14">
                <div className="grid lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-7">
                    <span className="eyebrow eyebrow-gold">
                      Application Mobile Android · APK Officiel v2.0
                    </span>
                    <h2 className="display-lg text-white mt-5 mb-5">
                      Tout le réseau TranSen{" "}
                      <span className="text-gradient-gold">dans votre poche</span>
                    </h2>
                    <p className="text-slate-300/95 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
                      Réservez votre siège de bus, appelez un chauffeur Allô Dakar ou suivez votre colis Yobanté en direct avec votre billet QR Code hors-ligne.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Link to="/contact" className="btn-gold">
                        <Download className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                            Téléchargement Direct
                          </div>
                          <div className="text-sm font-extrabold">Obtenir l'APK Android</div>
                        </div>
                      </Link>
                      <Link to="/compagnies" className="btn-ghost">
                        <Building2 className="w-5 h-5 text-cyan-300" />
                        <div className="text-left">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            Transporteurs B2B
                          </div>
                          <div className="text-sm font-bold">Portail Compagnies</div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* CSS Holographic Smartphone Mockup */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="relative w-64 sm:w-72 rounded-[36px] p-3 bg-gradient-to-b from-emerald-400/30 via-cyan-400/15 to-amber-400/25 border border-emerald-300/40 shadow-[0_25px_80px_-15px_rgba(16,185,129,0.45)] animate-float">
                      <div className="bg-[#03100b] rounded-[28px] p-5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="TranSen" className="w-7 h-7 rounded-lg bg-white p-0.5 object-contain" />
                            <span className="text-xs font-extrabold text-white font-display">TranSen Mobile</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            GPS ACTIF
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-400/30">
                          <div className="text-[10px] font-mono text-emerald-300 uppercase">Billet QR Embarquement</div>
                          <div className="text-sm font-extrabold text-white mt-0.5">Dakar → Saint-Louis</div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                            <span className="text-amber-300 font-bold">Siège #04 · VIP</span>
                            <span className="text-cyan-300">Payé SenePay</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-center">
                          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                            <div className="text-lg font-extrabold text-amber-300 font-display">2%</div>
                            <div className="text-[10px] font-mono text-slate-400">Commission</div>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                            <div className="text-lg font-extrabold text-emerald-300 font-display">14/14</div>
                            <div className="text-[10px] font-mono text-slate-400">Régions SN</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </>
  );
}
