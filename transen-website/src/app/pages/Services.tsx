import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bus, Car, Package, Shield, Zap, MapPin, CreditCard, Clock,
  CheckCircle, QrCode, Users, Smartphone, ArrowRight, Star, ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/* ── Seat Map Demo ──────────────────────────────────────────────────── */
const DEMO_OCCUPIED = [3, 6, 9, 12];
const DEMO_BOARDED = [1, 4];

function SeatMapDemo() {
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = (n: number) => {
    if (DEMO_OCCUPIED.includes(n) || DEMO_BOARDED.includes(n)) return;
    setSelected(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);
  };
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
      <div className="text-center mb-4">
        <div className="text-sm text-gray-500 mb-1">Plan des sièges · Minibus 15 places</div>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" /> Libre</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Réservé</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-400 inline-block" /> Embarqué</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--brand-gold)] inline-block" /> Sélectionné</span>
        </div>
      </div>
      <div className="flex justify-end mb-3 pr-1">
        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-lg">🚐</div>
      </div>
      {[0, 1, 2, 3, 4].map(row => (
        <div key={row} className="flex gap-2 mb-2 justify-center">
          {[row * 3 + 1, row * 3 + 2].map(n => (
            <button
              key={n}
              onClick={() => toggle(n)}
              className={`w-10 h-10 rounded-xl text-xs border-2 transition-all ${
                DEMO_BOARDED.includes(n)
                  ? "bg-violet-400 border-violet-500 text-white cursor-default"
                  : DEMO_OCCUPIED.includes(n)
                  ? "bg-blue-100 border-blue-200 text-blue-400 cursor-not-allowed"
                  : selected.includes(n)
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-gray-900"
                  : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              }`}
            >
              {n}
            </button>
          ))}
          <div className="w-5" />
          {(() => {
            const n = row * 3 + 3;
            return (
              <button
                key={n}
                onClick={() => toggle(n)}
                className={`w-10 h-10 rounded-xl text-xs border-2 transition-all ${
                  DEMO_BOARDED.includes(n)
                    ? "bg-violet-400 border-violet-500 text-white cursor-default"
                    : DEMO_OCCUPIED.includes(n)
                    ? "bg-blue-100 border-blue-200 text-blue-400 cursor-not-allowed"
                    : selected.includes(n)
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-gray-900"
                    : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                }`}
              >
                {n}
              </button>
            );
          })()}
        </div>
      ))}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm"
          style={{ color: "var(--brand-green)" }}
        >
          Siège{selected.length > 1 ? "s" : ""} {selected.join(", ")} sélectionné{selected.length > 1 ? "s" : ""}
        </motion.div>
      )}
    </div>
  );
}

/* ── FAQ item ───────────────────────────────────────────────────────── */
function Accord({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3"
      >
        <span className="text-gray-800 text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 text-sm pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

export function Services() {
  const [activeService, setActiveService] = useState<"bus" | "vtc" | "colis">("bus");

  const TABS = [
    { id: "bus" as const, label: "Compagnies Partenaires", Icon: Bus, color: "#14A44D" },
    { id: "vtc" as const, label: "Allô Dakar", Icon: Car, color: "#1a7a40" },
    { id: "colis" as const, label: "Yobante – Colis", Icon: Package, color: "#cc8800" },
  ];

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(135deg, #062617 0%, #14A44D 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full text-sm mb-6"
              style={{ backgroundColor: "rgba(255,215,0,0.2)", color: "var(--brand-gold)" }}
            >
              Découvrez nos services
            </div>
            <h1 className="text-4xl md:text-5xl text-white mb-5">
              Une plateforme,<br />trois solutions de transport
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto leading-relaxed">
              Allô Dakar pour les courses directes, Compagnies Partenaires pour les voyages planifiés,
              et Yobante pour l'envoi de colis interurbain.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Service Selector Tabs ────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Nav */}
          <div className="flex flex-wrap gap-3 justify-center mb-14">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveService(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all ${
                  activeService === tab.id ? "text-white shadow-lg" : "text-gray-600 bg-white hover:bg-gray-50"
                }`}
                style={
                  activeService === tab.id
                    ? { backgroundColor: tab.color, borderColor: tab.color }
                    : { borderColor: "#e5e7eb" }
                }
              >
                <tab.Icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bus Company Panel */}
          <AnimatePresence mode="wait">
            {activeService === "bus" && (
              <motion.div
                key="bus"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs text-white mb-5"
                      style={{ backgroundColor: "#14A44D" }}
                    >
                      BUS_COMPANY · Voyage planifié
                    </div>
                    <h2 className="text-3xl mb-4" style={{ color: "var(--brand-green)" }}>
                      Compagnies Partenaires
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6">
                      Réservez votre siège sur un bus d'une compagnie certifiée TranSen.
                      Horaires fixes, paiement SenePay en ligne et ticket QR Code à présenter à bord.
                      Le chauffeur valide votre embarquement en scannant votre code.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Sélection interactive de votre siège avant le départ",
                        "Paiement obligatoire en ligne via SenePay (Wave, Orange Money, Free Money)",
                        "Ticket QR Code unique (boardingCode NIR) envoyé instantanément",
                        "Suivi GPS en temps réel du véhicule",
                        "Annulation ou modification depuis l'application",
                        "Compagnies vérifiées KYC (RCCM, NINEA)",
                      ].map(f => (
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { Icon: QrCode, label: "QR Code d'embarquement" },
                        { Icon: CreditCard, label: "SenePay obligatoire" },
                        { Icon: Shield, label: "Compagnies certifiées" },
                      ].map(({ Icon, label }) => (
                        <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center">
                          <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--brand-green)" }} />
                          <p className="text-xs text-gray-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 text-center mb-4">Démonstration interactive · Cliquez sur un siège</p>
                    <SeatMapDemo />
                  </div>
                </div>

                {/* Journey flow */}
                <div className="bg-gray-50 rounded-3xl p-8">
                  <h3 className="text-xl mb-8 text-center" style={{ color: "var(--brand-green)" }}>
                    Comment fonctionne une réservation ?
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { step: "1", Icon: Smartphone, title: "Choisissez votre compagnie", desc: "Sélectionnez la compagnie, l'axe de voyage et l'horaire." },
                      { step: "2", Icon: Users, title: "Sélectionnez votre siège", desc: "Choisissez votre siège sur le plan graphique du véhicule." },
                      { step: "3", Icon: CreditCard, title: "Payez en ligne", desc: "Réglez via Wave, Orange Money ou Free Money (SenePay)." },
                      { step: "4", Icon: QrCode, title: "Embarquez avec votre QR", desc: "Présentez votre boardingCode NIR au chauffeur." },
                    ].map(s => (
                      <div key={s.step} className="text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
                          style={{ backgroundColor: "var(--brand-gold)" }}
                        >
                          <s.Icon className="w-6 h-6 text-gray-900" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                            style={{ backgroundColor: "var(--brand-green)" }}
                          >
                            {s.step}
                          </div>
                        </div>
                        <h4 className="text-sm mb-2" style={{ color: "#1a1a1a" }}>{s.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Allô Dakar Panel */}
            {activeService === "vtc" && (
              <motion.div
                key="vtc"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs text-white mb-5"
                      style={{ backgroundColor: "#1a7a40" }}
                    >
                      ALLO_DAKAR · Course directe
                    </div>
                    <h2 className="text-3xl mb-4" style={{ color: "#1a7a40" }}>
                      Allô Dakar – Chauffeurs Indépendants
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6">
                      Commandez une course directe avec un chauffeur indépendant vérifié TranSen.
                      Idéal pour les départs rapides, 1 à 4 passagers, paiement à bord.
                      Les chauffeurs sont géolocalisés en temps réel via l'application.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Chauffeurs indépendants certifiés et géolocalisés",
                        "Course directe 1 à 4 passagers",
                        "Départ immédiat ou programmé",
                        "Paiement à bord : Espèces, Wave, Orange Money",
                        "Bourse publique ouverte à tous les chauffeurs qualifiés",
                        "Évaluation du chauffeur après chaque course",
                      ].map(f => (
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-[#1a7a40] shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Types de paiement acceptés</p>
                      <div className="flex gap-3 flex-wrap">
                        {["Espèces", "Wave", "Orange Money"].map(m => (
                          <span key={m} className="px-3 py-1.5 rounded-xl text-sm bg-white border border-gray-200 text-gray-700 shadow-sm">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="rounded-3xl overflow-hidden shadow-2xl">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1562993610-121a6b465200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncHMlMjBuYXZpZ2F0aW9uJTIwbWFwfGVufDF8fHx8MTc2MzEyNDA0Nnww&ixlib=rb-4.1.0&q=80&w=800"
                        alt="Chauffeur Allô Dakar"
                        className="w-full h-80 object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { Icon: Zap, title: "Disponible maintenant", desc: "Les chauffeurs en service sont visibles en temps réel sur la carte." },
                    { Icon: Star, title: "Évalués 4.8/5", desc: "Chaque chauffeur est noté par les passagers après chaque course." },
                    { Icon: Shield, title: "Identité vérifiée", desc: "Permis de conduire, pièce d'identité et véhicule tous vérifiés." },
                  ].map(({ Icon, title, desc }) => (
                    <div key={title} className="bg-gray-50 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: "#1a7a4020" }}
                      >
                        <Icon className="w-6 h-6" style={{ color: "#1a7a40" }} />
                      </div>
                      <h4 className="mb-2 text-gray-800">{title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Yobante Panel */}
            {activeService === "colis" && (
              <motion.div
                key="colis"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs text-white mb-5"
                      style={{ backgroundColor: "#cc8800" }}
                    >
                      YOBANTE · Envoi de colis
                    </div>
                    <h2 className="text-3xl mb-4" style={{ color: "#cc8800" }}>
                      Yobante – Transport de Colis
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6">
                      Envoyez vos colis d'une ville à l'autre de manière sécurisée et rapide.
                      Suivi GPS en temps réel, assurance incluse et confirmation de réception
                      par le destinataire.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "Colis jusqu'à 20 kg par expédition",
                        "Suivi GPS en temps réel",
                        "Assurance automatiquement incluse",
                        "Confirmation de livraison par SMS et notification",
                        "Tarifs compétitifs, calculés selon le poids",
                        "Service disponible sur toutes les régions desservies",
                      ].map(f => (
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#cc8800" }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="rounded-3xl overflow-hidden shadow-2xl">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1595361314562-0ca40462f4f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdod2F5JTIwcm9hZCUyMHRyYXZlbHxlbnwxfHx8fDE3NjMwNTU0Nzh8MA&ixlib=rb-4.1.0&q=80&w=800"
                        alt="Transport de colis Yobante"
                        className="w-full h-80 object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { label: "Standard", weight: "< 5 kg", price: "2 000", delay: "Même jour" },
                    { label: "Large", weight: "5 – 20 kg", price: "4 500", delay: "Même jour" },
                    { label: "Express", weight: "Tout poids", price: "6 000", delay: "< 2 heures" },
                  ].map(p => (
                    <div key={p.label} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <div className="text-xs mb-3" style={{ color: "#cc8800" }}>{p.delay}</div>
                      <h4 className="mb-1 text-gray-800">Colis {p.label}</h4>
                      <p className="text-sm text-gray-500 mb-4">Jusqu'à {p.weight}</p>
                      <div className="text-2xl mb-1" style={{ color: "#cc8800" }}>{p.price} FCFA</div>
                      <p className="text-xs text-gray-400">Assurance incluse</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Common Features ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ color: "var(--brand-green)" }}>
              Fonctionnalités communes à tous les services
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { Icon: MapPin, title: "Suivi GPS temps réel", desc: "Localisez votre véhicule ou colis à tout moment depuis l'application." },
              { Icon: Shield, title: "Assurance voyage", desc: "Chaque trajet est couvert par une assurance incluse dans le prix." },
              { Icon: Clock, title: "Support 24h/7j", desc: "Notre équipe est disponible à tout moment pour vous assister." },
              { Icon: CreditCard, title: "Paiements sécurisés", desc: "Toutes les transactions sont chiffrées via la passerelle SenePay." },
              { Icon: Smartphone, title: "Application intuitive", desc: "Interface simple et rapide, pensée pour tous les Sénégalais." },
              { Icon: Star, title: "Avis vérifiés", desc: "Chaque chauffeur et compagnie est évalué par les vrais passagers." },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all h-full">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "var(--brand-gold)" + "25" }}
                  >
                    <f.Icon className="w-6 h-6" style={{ color: "var(--brand-green)" }} />
                  </div>
                  <h3 className="mb-2 text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <h2 className="text-3xl text-center mb-10" style={{ color: "var(--brand-green)" }}>
              Questions fréquentes sur nos services
            </h2>
          </FadeUp>
          <div>
            <Accord
              q="Comment fonctionne la sélection de siège pour les compagnies ?"
              a="Après avoir choisi votre compagnie et l'horaire, un plan graphique du minibus (15 places) s'affiche. Les sièges verts sont libres, bleus sont réservés et violets ont déjà embarqué. Cliquez sur un siège vert pour le sélectionner puis procédez au paiement SenePay."
            />
            <Accord
              q="Mon paiement est-il sécurisé ?"
              a="Oui. Tous les paiements transitent par SenePay, la passerelle de paiement mobile sécurisée qui intègre Wave, Orange Money et Free Money. Vos données bancaires ne sont jamais stockées sur nos serveurs."
            />
            <Accord
              q="Que se passe-t-il si je dois annuler ma réservation ?"
              a="Vous pouvez annuler depuis l'application jusqu'à 2h avant le départ pour obtenir un remboursement complet. L'administrateur de la compagnie peut également annuler votre réservation depuis le panel web compagnie."
            />
            <Accord
              q="Comment mon colis Yobante est-il suivi ?"
              a="Chaque colis reçoit un code de suivi unique. Vous et votre destinataire recevez des notifications SMS à chaque étape (collecte, en transit, livré). Le suivi GPS en temps réel est disponible depuis l'application."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: "var(--brand-green)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl text-white mb-5">Prêt à voyager avec TranSen ?</h2>
            <p className="text-white/70 mb-8">Téléchargez l'application et réservez votre premier trajet dès aujourd'hui.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/contact"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl transition-all hover:shadow-xl"
                style={{ backgroundColor: "var(--brand-gold)", color: "#111" }}
              >
                Télécharger l'App <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/tarifs"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white text-white hover:bg-white/10 transition-all"
              >
                Voir les tarifs <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
