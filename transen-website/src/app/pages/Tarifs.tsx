import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle, Shield, TrendingDown, Eye, Search, ArrowRight,
  Clock, MapPin, ChevronDown, Bus, Car, Package, Filter
} from "lucide-react";

const SENEGAL_CITIES = [
  "Dakar", "Thiès", "Touba", "Kaolack", "Saint-Louis", "Ziguinchor",
  "Tambacounda", "Louga", "Kolda", "Diourbel", "Fatick", "Kaffrine",
  "Sédhiou", "Matam", "Mbour", "Rufisque"
];

interface Route {
  from: string;
  to: string;
  priceMin: number;
  priceMax: number;
  duration: string;
  type: "bus" | "vtc";
  popular?: boolean;
}

const ALL_ROUTES: Route[] = [
  { from: "Dakar", to: "Thiès", priceMin: 2000, priceMax: 2500, duration: "1h", type: "bus", popular: true },
  { from: "Dakar", to: "Saint-Louis", priceMin: 5000, priceMax: 6000, duration: "3h30", type: "bus", popular: true },
  { from: "Dakar", to: "Kaolack", priceMin: 3500, priceMax: 4000, duration: "2h30", type: "bus", popular: true },
  { from: "Dakar", to: "Tambacounda", priceMin: 8000, priceMax: 9000, duration: "7h", type: "bus" },
  { from: "Dakar", to: "Ziguinchor", priceMin: 9000, priceMax: 10000, duration: "8h", type: "bus" },
  { from: "Dakar", to: "Touba", priceMin: 3000, priceMax: 3500, duration: "2h", type: "bus", popular: true },
  { from: "Thiès", to: "Touba", priceMin: 2500, priceMax: 3000, duration: "2h", type: "bus" },
  { from: "Kaolack", to: "Fatick", priceMin: 1500, priceMax: 2000, duration: "1h", type: "bus" },
  { from: "Saint-Louis", to: "Louga", priceMin: 2000, priceMax: 2500, duration: "1h30", type: "bus" },
  { from: "Dakar", to: "Kolda", priceMin: 8500, priceMax: 9500, duration: "8h", type: "bus" },
  { from: "Dakar", to: "Matam", priceMin: 10000, priceMax: 12000, duration: "9h", type: "bus" },
  { from: "Kaolack", to: "Tambacounda", priceMin: 5000, priceMax: 6000, duration: "4h", type: "bus" },
  { from: "Dakar", to: "Thiès", priceMin: 3500, priceMax: 5000, duration: "1h", type: "vtc" },
  { from: "Dakar", to: "Kaolack", priceMin: 5000, priceMax: 7000, duration: "2h30", type: "vtc" },
];

const COLIS_RATES = [
  { label: "Standard (< 5 kg)", price: 2000, delay: "Même jour" },
  { label: "Large (5 – 20 kg)", price: 4500, delay: "Même jour" },
  { label: "Express Prioritaire", price: 6000, delay: "< 2 heures" },
];

function CitySelect({ label, value, onChange, exclude }: {
  label: string; value: string; onChange: (v: string) => void; exclude?: string
}) {
  const [open, setOpen] = useState(false);
  const cities = SENEGAL_CITIES.filter(c => c !== exclude);
  return (
    <div className="relative">
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 text-left bg-white hover:border-green-300 transition-all"
      >
        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
        <span className={`flex-1 text-sm ${value ? "text-gray-800" : "text-gray-400"}`}>
          {value || label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto border border-gray-100"
          >
            {value && (
              <button
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
              >
                Toutes les villes
              </button>
            )}
            {cities.map(c => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  value === c ? "text-[var(--brand-green)]" : "text-gray-700"
                }`}
              >
                {c}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PriceDisplay({ min, max }: { min: number; max: number }) {
  return (
    <span style={{ color: "var(--brand-green)" }}>
      {min.toLocaleString("fr-FR")} – {max.toLocaleString("fr-FR")}
      <span className="text-sm text-gray-400 ml-1">FCFA</span>
    </span>
  );
}

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Tarifs() {
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bus" | "vtc" | "colis">("all");
  const [searched, setSearched] = useState(false);

  const filteredRoutes = ALL_ROUTES.filter(r => {
    if (typeFilter === "colis") return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (filterFrom && r.from.toLowerCase() !== filterFrom.toLowerCase()) return false;
    if (filterTo && r.to.toLowerCase() !== filterTo.toLowerCase()) return false;
    return true;
  });

  const popularRoutes = ALL_ROUTES.filter(r => r.popular && r.type === "bus");

  const handleSearch = () => setSearched(true);
  const handleReset = () => {
    setFilterFrom("");
    setFilterTo("");
    setTypeFilter("all");
    setSearched(false);
  };

  const displayRoutes = searched ? filteredRoutes : popularRoutes;
  const showColis = typeFilter === "colis" || typeFilter === "all";

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
              Tarifs transparents
            </div>
            <h1 className="text-4xl md:text-5xl text-white mb-5">
              Des prix clairs, sans surprises
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto leading-relaxed">
              Consultez la grille tarifaire indicative pour tous vos déplacements au Sénégal.
              Les prix exacts s'affichent lors de votre réservation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Search & Filter ──────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="bg-gray-50 rounded-3xl p-6">
              <p className="text-sm text-gray-500 mb-5 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrer les tarifs par trajet et type de service
              </p>

              {/* Type Filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { id: "all" as const, label: "Tous", Icon: null },
                  { id: "bus" as const, label: "Bus / Compagnies", Icon: Bus },
                  { id: "vtc" as const, label: "Allô Dakar", Icon: Car },
                  { id: "colis" as const, label: "Yobante (Colis)", Icon: Package },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border transition-all ${
                      typeFilter === t.id ? "text-white shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                    style={typeFilter === t.id ? { backgroundColor: "var(--brand-green)", borderColor: "var(--brand-green)" } : {}}
                  >
                    {t.Icon && <t.Icon className="w-4 h-4" />}
                    {t.label}
                  </button>
                ))}
              </div>

              {typeFilter !== "colis" && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <CitySelect label="Ville de départ" value={filterFrom} onChange={setFilterFrom} exclude={filterTo} />
                  <CitySelect label="Destination" value={filterTo} onChange={setFilterTo} exclude={filterFrom} />
                  <div className="flex flex-col justify-end gap-2">
                    <button
                      onClick={handleSearch}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-gray-900 transition-all hover:shadow-lg"
                      style={{ backgroundColor: "var(--brand-gold)" }}
                    >
                      <Search className="w-4 h-4" />
                      Rechercher
                    </button>
                    {searched && (
                      <button
                        onClick={handleReset}
                        className="text-xs text-gray-400 hover:text-gray-600 text-center"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Route Table ────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {typeFilter !== "colis" && (
            <FadeUp>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl mb-1" style={{ color: "var(--brand-green)" }}>
                    {searched && (filterFrom || filterTo)
                      ? `${filterFrom || "Toutes villes"} → ${filterTo || "Toutes destinations"}`
                      : "Trajets les plus populaires"
                    }
                  </h2>
                  <p className="text-sm text-gray-400">
                    {displayRoutes.length} trajet{displayRoutes.length > 1 ? "s" : ""} — Tarifs indicatifs en FCFA
                  </p>
                </div>
                {typeFilter === "bus" || typeFilter === "all" ? (
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    Paiement SenePay en ligne
                  </div>
                ) : null}
              </div>

              <AnimatePresence mode="wait">
                {displayRoutes.length > 0 ? (
                  <motion.div
                    key={`${filterFrom}-${filterTo}-${typeFilter}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                  >
                    <table className="w-full">
                      <thead style={{ backgroundColor: "var(--brand-green)" }}>
                        <tr>
                          <th className="px-5 py-4 text-left text-sm text-white">Départ</th>
                          <th className="px-5 py-4 text-left text-sm text-white">Destination</th>
                          <th className="px-5 py-4 text-left text-sm text-white">Durée</th>
                          <th className="px-5 py-4 text-left text-sm text-white">Tarif (FCFA)</th>
                          <th className="px-5 py-4 text-left text-sm text-white">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRoutes.map((route, i) => (
                          <motion.tr
                            key={`${route.from}-${route.to}-${route.type}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm text-gray-800">{route.from}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm text-gray-800">{route.to}</span>
                                {route.popular && route.type === "bus" && (
                                  <span className="text-xs px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: "var(--brand-gold)", color: "#111" }}
                                  >
                                    Populaire
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                {route.duration}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <PriceDisplay min={route.priceMin} max={route.priceMax} />
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                                route.type === "bus"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}>
                                {route.type === "bus" ? <Bus className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                                {route.type === "bus" ? "Compagnie" : "VTC"}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 text-gray-400"
                  >
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="mb-2">Aucun tarif trouvé pour cette recherche</p>
                    <button onClick={handleReset} className="text-sm underline" style={{ color: "var(--brand-green)" }}>
                      Voir tous les trajets
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-gray-400 mt-4 text-center">
                * Les prix peuvent varier selon la compagnie, le type de véhicule et la disponibilité.
              </p>
            </FadeUp>
          )}

          {/* Colis rates */}
          {showColis && (
            <FadeUp delay={typeFilter === "colis" ? 0 : 0.4}>
              <div className={typeFilter !== "colis" ? "mt-12 pt-12 border-t border-gray-100" : ""}>
                <div className="mb-6">
                  <h2 className="text-2xl mb-1" style={{ color: "var(--brand-green)" }}>
                    Tarifs Yobante – Envoi de Colis
                  </h2>
                  <p className="text-sm text-gray-400">Prix indicatifs pour l'envoi interurbain</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-5">
                  {COLIS_RATES.map((r, i) => (
                    <motion.div
                      key={r.label}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="text-xs mb-2" style={{ color: "#cc8800" }}>{r.delay}</div>
                      <h3 className="mb-3 text-gray-800">{r.label}</h3>
                      <div className="text-2xl mb-1" style={{ color: "var(--brand-green)" }}>
                        {r.price.toLocaleString("fr-FR")} FCFA
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Assurance incluse
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeUp>
          )}
        </div>
      </section>

      {/* ── Value Props ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <h2 className="text-3xl text-center mb-12" style={{ color: "var(--brand-green)" }}>
              Nos engagements tarifaires
            </h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Eye, title: "Transparence totale", desc: "Prix affichés avant réservation, aucun frais caché ni surprise à l'arrivée." },
              { Icon: TrendingDown, title: "Prix compétitifs", desc: "Tarifs alignés sur le marché sénégalais avec la qualité TranSen en plus." },
              { Icon: Shield, title: "Valeur garantie", desc: "Assurance, suivi GPS et chauffeurs certifiés inclus dans chaque tarif." },
            ].map((p, i) => (
              <FadeUp key={p.title} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: "rgba(255,215,0,0.25)" }}
                  >
                    <p.Icon className="w-6 h-6" style={{ color: "var(--brand-green)" }} />
                  </div>
                  <h3 className="mb-3 text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Driver Commission, Subscription & Routing Logic ────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-amber-500 uppercase tracking-widest font-mono bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-300/15">
                Modèle Financier & Routage
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-4" style={{ color: "var(--brand-green)" }}>
                Règles de Commission et de Routage
              </h2>
              <p className="text-gray-500 mt-2 max-w-2xl mx-auto text-sm">
                Une architecture conçue pour la flexibilité des chauffeurs indépendants et la sécurité financière des compagnies de transport.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Prérecommandation Check Card */}
            <FadeUp delay={0.1}>
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 mb-4 font-bold text-sm">✓</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Le "Check" Système Chauffeur</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Avant de pouvoir accepter toute course interurbaine, le backend Spring Boot exécute une double vérification stricte :
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">1.</span>
                      <span><strong>Abonnement Actif :</strong> Si le chauffeur a souscrit un forfait pro, il accepte la course immédiatement sans frais.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">2.</span>
                      <span><strong>Fallback TransPay :</strong> Sans abonnement, son portefeuille TransPay est vérifié. La course est validée si le solde couvre la commission de 1%.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Vérification Spring Boot</span>
                  <span className="text-emerald-500 font-bold">Actif</span>
                </div>
              </div>
            </FadeUp>

            {/* Chauffeurs Indépendants Card */}
            <FadeUp delay={0.2}>
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4 font-bold text-sm">🚕</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Chauffeurs Allô Dakar</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Dédiée aux chauffeurs de véhicules de 4 places maximum (plafond de covoiturage strict à 4 passagers) :
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-emerald-500 shrink-0">✔</span>
                      <span>Paiement systématique en <strong>espèces</strong> par le passager à l'embarquement.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-500 shrink-0">✔</span>
                      <span>Commission standard de <strong>1%</strong> prélevée directement sur le compte TransPay, sauf sous abonnement illimité.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Capacité max</span>
                  <span className="text-gray-700 font-semibold">4 passagers</span>
                </div>
              </div>
            </FadeUp>

            {/* Compagnies Card */}
            <FadeUp delay={0.3}>
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-4 font-bold text-lg">🏢</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Compagnies Partenaires</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Pour les flottes de bus et minibus (capacités dynamiques allant jusqu'à 60 places par bus) gérées via <code className="bg-gray-150 p-0.5 rounded font-mono">compagnie.transen.org</code> :
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-emerald-500 shrink-0">✔</span>
                      <span><strong>Demande Spécifique:</strong> Le client paye par SenePay (OM, Wave, Free). 99% crédités sur le dashboard compagnie, 1% retenus par TranSen.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500 shrink-0">⚠</span>
                      <span><strong>Demande Publique (Immédiat):</strong> Paiement obligatoire en espèces pour sécuriser physiquement la course.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>Capacité bus</span>
                  <span className="text-gray-700 font-semibold">10 à 60 places</span>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <h2 className="text-3xl mb-4" style={{ color: "var(--brand-green)" }}>Des questions sur nos tarifs ?</h2>
            <p className="text-gray-500 mb-8">Notre équipe vous répond rapidement sur WhatsApp.</p>
            <a
              href="https://wa.me/221781386405"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-gray-900 transition-all hover:shadow-xl"
              style={{ backgroundColor: "var(--brand-gold)" }}
            >
              Contactez-nous sur WhatsApp
            </a>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
