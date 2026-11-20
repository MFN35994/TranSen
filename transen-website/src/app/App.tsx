import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { PremiumAmbientEngine } from "./components/PremiumAmbientEngine";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Compass } from "lucide-react";

// Code-splitting par route : seul Home est chargé immédiatement
const Services = lazy(() => import("./pages/Services").then((m) => ({ default: m.Services })));
const Tarifs = lazy(() => import("./pages/Tarifs").then((m) => ({ default: m.Tarifs })));
const Chauffeurs = lazy(() => import("./pages/Chauffeurs").then((m) => ({ default: m.Chauffeurs })));
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const Team = lazy(() => import("./pages/Team").then((m) => ({ default: m.Team })));
const FAQ = lazy(() => import("./pages/FAQ").then((m) => ({ default: m.FAQ })));
const Contact = lazy(() => import("./pages/Contact").then((m) => ({ default: m.Contact })));
const Investir = lazy(() => import("./pages/Investir").then((m) => ({ default: m.Investir })));
const Compagnies = lazy(() => import("./pages/Compagnies").then((m) => ({ default: m.Compagnies })));
const CGU = lazy(() => import("./pages/CGU").then((m) => ({ default: m.CGU })));
const Politique = lazy(() => import("./pages/Politique").then((m) => ({ default: m.Politique })));
const Mentions = lazy(() => import("./pages/Mentions").then((m) => ({ default: m.Mentions })));

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 animate-pulse">
      <div className="h-44 rounded-3xl bg-emerald-950/30 border border-white/5" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="h-48 rounded-2xl bg-white/[0.05]" />
        <div className="h-48 rounded-2xl bg-white/[0.05]" />
        <div className="h-48 rounded-2xl bg-white/[0.05]" />
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-20 aurora-bg">
      <div className="max-w-lg w-full text-center glass-strong rounded-3xl p-10">
        <div className="icon-tile icon-tile-gold mx-auto mb-6">
          <Compass className="w-7 h-7" />
        </div>
        <span className="eyebrow eyebrow-gold mb-4">Erreur 404</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display mt-3 mb-3">
          Itinéraire introuvable
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
          La page demandée n'existe pas ou a été déplacée. Retournez à l'accueil TranSen pour continuer votre trajet.
        </p>
        <Link to="/" className="btn-gold text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>
    </section>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const ROUTE_SEO_META: Record<string, { title: string; description: string; canonicalPath?: string }> = {
  "/": {
    title: "TranSen - La plateforme de mobilité de référence au Sénégal",
    description: "Réservez vos trajets en bus interurbains, commandez une course Allô Dakar ou expédiez vos colis Yobanté au Sénégal à 2% de commission.",
    canonicalPath: "/",
  },
  "/services": {
    title: "Services Bus, Allô Dakar VTC & Colis Yobanté - TranSen",
    description: "Découvrez nos trois services de transport au Sénégal : voyages interurbains, courses urbaines Allô Dakar et livraison de colis Yobanté.",
  },
  "/tarifs": {
    title: "Tarifs Transparents & Commission Unique 2% - TranSen",
    description: "Consultez les tarifs interurbains Dakar-Thiès-Touba-Saint-Louis-Ziguinchor, nos forfaits chauffeurs et notre commission unique de 2%.",
  },
  "/compagnies": {
    title: "Espace Compagnies de Transport & Flottes B2B - TranSen",
    description: "Digitalisez votre compagnie de transport au Sénégal : billetterie en ligne, suivi GPS des bus et reversement à 98%.",
  },
  "/chauffeurs": {
    title: "Devenir Chauffeur Partenaire TranSen (Allô Dakar / Bus) - 2% de commission",
    description: "Conduisez avec TranSen au Sénégal : conservez 98% de vos revenus ou passez à 0% de commission via abonnement.",
  },
  "/investir": {
    title: "Investir dans TranSen - Levée Phase 1 & Actionnariat",
    description: "Participez au capital de l'infrastructure de mobilité du Sénégal (Tour Phase 1 : 217,8 M FCFA) dès 500 FCFA ou en ticket institutionnel.",
  },
  "/about": {
    title: "À Propos de TranSen - Vision Mobilité Sénégal",
    description: "L'histoire, la mission tri-modale 14 régions et la feuille de route en 3 phases de la plateforme TranSen au Sénégal.",
  },
  "/team": {
    title: "Notre Équipe - TranSen Sénégal",
    description: "Rencontrez Mouhamadou Fadilou Ndiaye et l'équipe dirigeante et technique qui construisent TranSen au Sénégal.",
  },
  "/faq": {
    title: "FAQ Passagers, Chauffeurs & Compagnies - TranSen",
    description: "Questions fréquentes sur les réservations de bus, paiements SenePay, abonnements chauffeurs et commission unique de 2%.",
  },
  "/contact": {
    title: "Contact & Téléchargement Application TranSen",
    description: "Contactez le support TranSen à Dakar (+221 78 138 64 05), accédez à app.transen.org ou téléchargez l'application mobile.",
  },
  "/conditions": {
    title: "Conditions Générales d'Utilisation - TranSen",
    description: "Conditions d'utilisation de la plateforme TranSen au Sénégal.",
  },
  "/cgu": {
    title: "Conditions Générales d'Utilisation - TranSen",
    description: "Conditions d'utilisation de la plateforme TranSen au Sénégal.",
    canonicalPath: "/conditions",
  },
  "/confidentialite": {
    title: "Politique de Confidentialité & Données - TranSen",
    description: "Politique de protection des données personnelles TranSen conforme aux normes CDP au Sénégal.",
  },
  "/politique": {
    title: "Politique de Confidentialité & Données - TranSen",
    description: "Politique de protection des données personnelles TranSen conforme aux normes CDP au Sénégal.",
    canonicalPath: "/confidentialite",
  },
  "/mentions-legales": {
    title: "Mentions Légales - TranSen",
    description: "Informations légales et éditeur de la plateforme TranSen.",
  },
  "/mentions": {
    title: "Mentions Légales - TranSen",
    description: "Informations légales et éditeur de la plateforme TranSen.",
    canonicalPath: "/mentions-legales",
  },
};

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}='${key}']`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function AppContent() {
  const location = useLocation();
  const [emergencyBanner, setEmergencyBanner] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    const meta = ROUTE_SEO_META[location.pathname] || ROUTE_SEO_META["/"];
    document.title = meta.title;
    setMetaTag("name", "description", meta.description);
    setMetaTag("property", "og:title", meta.title);
    setMetaTag("property", "og:description", meta.description);

    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const targetPath = meta.canonicalPath ?? location.pathname;
    const urlPath = targetPath === "/" ? "" : targetPath;
    const fullUrl = `https://transen.org${urlPath}`;
    canonical.setAttribute("href", fullUrl);
    setMetaTag("property", "og:url", fullUrl);

    // Balise télémétrique temps réel vers le Centre de Commandement Super-Admin
    const routeFeatureMap: Record<string, string> = {
      "/": "BUS_SEARCH_ENGINE",
      "/services": "ALLO_DAKAR_VTC_DISPATCH",
      "/tarifs": "VTC_PRICE_CALCULATOR",
      "/compagnies": "B2B_COMPANY_AUTH_KYC",
      "/chauffeurs": "OTP_SMS_AUTHENTICATION",
      "/investir": "INVESTOR_PORTAL_SUBSCRIPTION",
      "/contact": "CONTACT_SUPPORT_LEADS",
    };
    const featureKey = routeFeatureMap[location.pathname] || "BUS_SEARCH_ENGINE";
    fetch("https://api.transen.org/api/system/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Transen-Platform": "transen.org" },
      body: JSON.stringify({
        featureKey,
        platform: "transen.org (Site Principal)",
        latencyMs: 18,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.emergencyBanner === "string") {
          setEmergencyBanner(d.emergencyBanner.trim());
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip relative bg-[#03100b] text-slate-100">
      <PremiumAmbientEngine />
      <Header emergencyBanner={emergencyBanner} />
      <main className={`flex-1 z-10 relative ${emergencyBanner ? "pt-[116px]" : "pt-[76px]"}`}>
        <Suspense fallback={<PageSkeleton />}>
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
              <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
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
