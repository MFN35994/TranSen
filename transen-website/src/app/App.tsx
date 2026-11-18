import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { PremiumAmbientEngine } from "./components/PremiumAmbientEngine";
import { motion, AnimatePresence } from "motion/react";

// Code-splitting par route (Règle 22) : seul Home est chargé immédiatement
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
      <div className="h-44 rounded-3xl bg-emerald-950/10" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="h-48 rounded-2xl bg-white/[0.06]" />
        <div className="h-48 rounded-2xl bg-white/[0.06]" />
        <div className="h-48 rounded-2xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
    description: "Consultez les tarifs interurbains Dakar-Thiès-Touba-Saint-Louis-Ziguinchor et notre commission plateforme unique de 2%.",
  },
  "/compagnies": {
    title: "Espace Compagnies de Transport & Flottes B2B - TranSen",
    description: "Digitalisez votre compagnie de transport au Sénégal : billetterie en ligne, suivi GPS des bus et reversement à 98%.",
  },
  "/chauffeurs": {
    title: "Devenir Chauffeur Partenaire TranSen (Allô Dakar / Bus) - 2% de commission",
    description: "Conduisez avec TranSen au Sénégal et conservez 98% de vos revenus grâce à notre commission unique de 2%.",
  },
  "/investir": {
    title: "Investir dans TranSen S.A.S. - Devenez Actionnaire",
    description: "Participez au capital de l'infrastructure de mobilité du Sénégal dès 500 FCFA par action via Wave, Orange Money et Free Money.",
  },
  "/about": {
    title: "À Propos de TranSen - Vision Mobilité Sénégal",
    description: "L'histoire, la mission et les compagnies partenaires certifiées de la plateforme TranSen au Sénégal.",
  },
  "/team": {
    title: "Notre Équipe - TranSen Sénégal",
    description: "Rencontrez l'équipe dirigeante et technique qui construit TranSen à Dakar.",
  },
  "/faq": {
    title: "FAQ Passagers, Chauffeurs & Compagnies - TranSen",
    description: "Questions fréquentes sur les réservations de bus, paiements SenePay et le taux unique de 2%.",
  },
  "/contact": {
    title: "Contact & Téléchargement APK Android - TranSen",
    description: "Contactez le support TranSen à Dakar (+221 78 138 64 05) ou téléchargez l'application mobile Android.",
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
    description: "Politique de protection des données personnelles TranSen conforme aux normes sénégalaises.",
  },
  "/politique": {
    title: "Politique de Confidentialité & Données - TranSen",
    description: "Politique de protection des données personnelles TranSen conforme aux normes sénégalaises.",
    canonicalPath: "/confidentialite",
  },
  "/mentions-legales": {
    title: "Mentions Légales - TranSen S.A.S.",
    description: "Informations légales et éditeur de la plateforme TranSen.",
  },
  "/mentions": {
    title: "Mentions Légales - TranSen S.A.S.",
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

  useEffect(() => {
    window.scrollTo(0, 0);

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
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      <PremiumAmbientEngine />
      <Header />
      <main className="flex-1 z-10 relative">
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
