import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Users, Receipt, ShieldCheck, ArrowRight, CheckCircle2, 
  MapPin, Calendar, LayoutDashboard, Database, HelpCircle, Sparkles, 
  Bus, Settings, Percent, FileVolume, CreditCard, ExternalLink
} from "lucide-react";

export function Compagnies() {
  const [activeStep, setActiveStep] = useState(0);

  const COMPANY_FLOWS = [
    {
      title: "1. Création de Compte & KYC",
      short: "Inscription légale",
      desc: "Soumettez vos documents d'agrément de transport au Sénégal, vos licences d'exploitation rattachées ainsi que vos détails d'enregistrement d'entreprise.",
      icon: Building2,
      features: ["Vérification d'agrément rapide", "Intégration d'identité de marque", "Gestion multi-opérateurs"]
    },
    {
      title: "2. Enregistrement de la Flotte (Autocars / Minibus)",
      short: "Gestion de flotte",
      desc: "Ajoutez vos bus, autocars grands trajets et minibus. Configurez vos dispositions de sièges personnalisées, de la simple berline à l'autocar de grande capacité.",
      icon: Bus,
      features: ["Nombre de places modulables (jusqu'à 60 chaises/sièges)", "Attribution de photos et équipements", "Suivi technique de validité de contrôle"]
    },
    {
      title: "3. Planification des Lignes & Tarifs",
      short: "Schedules & Tarifs",
      desc: "Configurez vos départs récurrents urbains ou interurbains et déterminez vos tarifs par billet. Les passagers réservent et choisissent leur fauteuil en direct sur TranSen.",
      icon: Calendar,
      features: ["Gestion des correspondances complexes", "Grille tarifaire dynamique par classe", "Arrêts intermédiaires configurables"]
    },
    {
      title: "4. Reversement direct & Taux Unique",
      short: "Redistribution & KPI",
      desc: "Suivez vos encaissements consolidés en direct. Grâce à notre modèle révolutionnaire, conservez 99% de vos ventes grâce à notre commission fixe de seulement 1%.",
      icon: Percent,
      features: ["Frais de service imbattables de 1%", "Compatibilité Mobile Money (Orange Money, Wave, SenePay)", "Rapports d'activité financiers quotidiens"]
    }
  ];

  const FREQUENT_QUESTIONS = [
    {
      q: "Quel est le nombre maximum de sièges autorisé par véhicule ?",
      a: "Pour garantir un confort optimal pour les voyages interurbains au Sénégal, nous supportons et limitons la configuration à 60 chaises/sièges maximum pour les grands bus autocars partenaires."
    },
    {
      q: "Comment fonctionne la commission unifiée de 1% ?",
      a: "C'est notre promesse phare : TranSen prélève uniquement 1% de frais sur la vente de chaque billet de transport, que ce soit pour les lignes urbaines ou interurbaines. Les 99% restants sont directement reversés sur le compte bancaire ou compte marchand de votre compagnie."
    },
    {
      q: "Les passagers peuvent-ils réserver des places spécifiques ?",
      a: "Oui ! Notre widget d'attribution permet aux passagers de visualiser la carte virtuelle 3D de vos autocars et de choisir leurs numéros de fauteuils à l'avance lors du paiement."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ── Visual Premium Header ────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28 text-white"
        style={{ background: "linear-gradient(135deg, #052315 0%, #0d562b 50%, #10a34b 100%)" }}
      >
        <div className="absolute inset-0 bg-grid-white opacity-5 pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-96 h-96 rounded-full bg-amber-400 opacity-10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Header info */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 border border-amber-300/30">
                <Sparkles className="w-4 h-4" />
                Espace Partenaires Transporteurs
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Digitalisez votre compagnie <br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                  à 1% de commission.
                </span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
                Ouvrez vos trajets urbains et interurbains aux millions d'usagers TranSen au Sénégal. Une plateforme dédiée à la croissance de vos lignes, l'optimisation de vos bus et le suivi de vos revenus.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://compagnie.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-gray-900 font-bold bg-amber-400 hover:bg-amber-300 hover:scale-[1.03] transition-all shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] cursor-pointer"
                >
                  Accéder au Portail Compagnie <ExternalLink className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            {/* Right Header illustration representing the modern digital dashboard / fleet control */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
              >
                {/* Simulated live telemetry overlay */}
                <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                
                <div className="flex gap-2 items-center mb-6">
                  <LayoutDashboard className="w-4.5 h-4.5 text-amber-400" />
                  <span className="text-xs uppercase tracking-wider font-bold font-mono text-zinc-400">TranSen Compagnie Port</span>
                </div>

                {/* Simulated Sales metric block */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center bg-gradient-to-r from-zinc-900 via-emerald-950/20 to-zinc-900">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ventes du jour (Net)</div>
                      <div className="text-2xl font-black text-white mt-1">1 245 000 FCFA</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-emerald-400 font-bold font-mono">+99.0% gardé</div>
                      <div className="text-xs text-zinc-500 mt-1 font-mono">Commission: 1%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <div className="text-zinc-500">Flux de Bus Actifs</div>
                      <div className="text-sm font-bold text-white mt-0.5">14 Autocars</div>
                    </div>
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <div className="text-zinc-500">Sièges réservés</div>
                      <div className="text-sm font-bold text-white mt-0.5">412 Passagers</div>
                    </div>
                  </div>
                </div>

                {/* Fleet representation status */}
                <div className="border-t border-zinc-800 pt-4 space-y-2.5 text-xs text-zinc-400">
                  <div className="flex justify-between font-mono">
                    <span>Bus Autocar S1 - (60 places)</span>
                    <span className="text-amber-400">Dakar ➔ Saint-Louis</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Bus Autocar S2 - (54 places)</span>
                    <span className="text-emerald-400">Touba ➔ Dakar</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Highlights Highlights ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-emerald-800 text-xs font-bold uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Pourquoi nous rejoindre ?
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 leading-tight">
              L'outil de commercialisation le plus rentable pour les transporteurs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-700 font-black text-xl mb-6">
                1%
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Taux de commission minimal</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Gardez 99% de vos revenus de billetterie. Notre modèle à seulement 1% s'applique équitablement sur toutes les lignes, sans frais cachés ni abonnements coûteux.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-6">
                <Bus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Jusqu'à 60 Sièges par Bus</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Prenez en charge l'ensemble de votre flotte d'autocars de grande capacité limités réglementairement à 60 fauteuils. Plan complet de réservation de sièges interactif libre.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Souveraineté des données</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Accédez à l'intégralité du fichier passagers, des historiques de trajets et de vos flux financiers pour une transparence totale de votre comptabilité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Workflow Timeline ─────────────────────────────────── */}
      <section className="py-24 bg-slate-100/60 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Interactive Timeline switcher */}
            <div className="lg:col-span-5">
              <span className="text-xs uppercase font-bold tracking-widest text-[#10a34b]">Fiches Pratiques</span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-8 leading-snug">
                Comment s'opère votre transition numérique ?
              </h2>

              <div className="space-y-4">
                {COMPANY_FLOWS.map((flow, idx) => (
                  <button
                    key={flow.short}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-4.5 rounded-2xl border transition-all flex items-center gap-4 ${
                      activeStep === idx
                        ? "bg-emerald-800 text-white border-transparent shadow-lg"
                        : "bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono ${
                      activeStep === idx ? "bg-amber-400 text-gray-900" : "bg-gray-100 text-gray-500"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs md:text-sm">{flow.short}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Flow Detail Display */}
            <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-gray-200/50 shadow-xl relative min-h-[360px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#10a34b]/15 flex items-center justify-center text-[#10a34b]">
                      {(() => {
                        const IconComponent = COMPANY_FLOWS[activeStep].icon;
                        return <IconComponent className="w-6 h-6" />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">{COMPANY_FLOWS[activeStep].title}</h3>
                  </div>

                  <p className="text-gray-500 leading-relaxed text-sm">
                    {COMPANY_FLOWS[activeStep].desc}
                  </p>

                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-3.5">Points de conformité garantis</p>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {COMPANY_FLOWS[activeStep].features.map((f) => (
                        <div key={f} className="flex gap-2.5 text-xs text-gray-600 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Redirection trigger helper */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-xs text-gray-400">
                  Prêt à configurer ? Les outils complets sont hébergés sur compagnie.transen.org
                </div>
                <a
                  href="https://compagnie.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-xs rounded-xl bg-[#10a34b] text-white font-bold inline-flex items-center gap-1.5 hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Ouvrir compagnie.transen.org
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase text-amber-500 tracking-widest">Une question ?</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Questions des Transporteurs</h2>
          </div>

          <div className="space-y-6">
            {FREQUENT_QUESTIONS.map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-600/30 transition-all">
                <h4 className="font-bold text-gray-900 text-base flex gap-2 items-start">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-gray-500 text-sm mt-3.5 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final Panel ─────────────────────────────────────────────── */}
      <section className="py-16 bg-zinc-950 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,163,75,0.1)_0%,transparent_80%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-[11px] tracking-widest uppercase font-mono text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full">
            Écosystème Uni Urbain & Interurbain
          </span>
          <h2 className="text-3xl md:text-5xl font-black mt-4 mb-6 leading-tight">
            Assurez le taux de remplissage maximal de vos autocars dès aujourd'hui
          </h2>
          <p className="text-zinc-400 text-md max-w-2xl mx-auto mb-10 leading-relaxed">
            Pas d'engagements financiers initiaux compliqués. Créez votre espace en 5 minutes et planifiez vos premières ventes de places à taux universel de 1%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://compagnie.transen.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#10a34b] hover:bg-emerald-800 transition-all text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 hover:scale-[1.03] shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
            >
              Créer un espace Compagnie <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="mailto:contact@transen.org"
              className="px-8 py-4 border border-zinc-800 hover:bg-zinc-900 transition-all text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Contacter le support commercial
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
