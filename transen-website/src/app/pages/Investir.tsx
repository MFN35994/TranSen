import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp, Shield, Award, Users, ArrowRight,
  TrendingDown, CheckCircle2, FileText, Send, Landmark, DollarSign, PieChart, Sparkles, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { submitInvestmentFormData } from "../services/api";

export function Investir() {
  const [activeTab, setActiveTab] = useState<"promise" | "portfolio">("promise");

  // Form states
  const [investorType, setInvestorType] = useState("Angel");
  const [amount, setAmount] = useState<number>(5000000); // 5 Million FCFA default (10,000 shares)
  const [investorName, setInvestorName] = useState("");
  const [investorEmail, setInvestorEmail] = useState("");
  const [investorPhone, setInvestorPhone] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated validated portfolio state matching 200,000,000 FCFA valuation
  const [submittedPromises, setSubmittedPromises] = useState<Array<{
    id: string;
    date: string;
    amount: number;
    type: string;
    equity: number;
    status: "Validé" | "En attente";
  }>>([
    { id: "TX-9021", date: "15/06/2026", amount: 15000000, type: "Capital Risque (VC)", equity: 7.5, status: "Validé" },
    { id: "TX-4028", date: "Actuelle", amount: 2000000, type: "Business Angel", equity: 1.0, status: "En attente" }
  ]);

  // Handle promise submission
  const handleSubmitPromise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorName || !investorEmail || !investorPhone) {
      toast.error("Veuillez remplir votre nom, votre adresse email et votre numéro de téléphone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sharesCount = Math.round(amount / 500);

      const formData = new FormData();
      formData.append("fullName", investorName);
      formData.append("email", investorEmail);
      formData.append("phone", investorPhone);
      formData.append("sharesCount", sharesCount.toString());

      console.log("[Investment] Submitting via FormData to production backend:", {
        fullName: investorName,
        email: investorEmail,
        phone: investorPhone,
        sharesCount: sharesCount
      });

      const response = await submitInvestmentFormData(formData);
      console.log("[Investment] Success response from server:", response);

      const calculatedEquity = Math.round((amount / 200000000) * 100 * 100) / 100;

      const newPromise = {
        id: response.investment?.id ? response.investment.id.substring(0, 8) : `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        date: "Aujourd'hui",
        amount: amount,
        type: investorType === "Angel" ? "Business Angel" : investorType === "VC" ? "Capital Risque (VC)" : "Institutionnel / Privé",
        equity: calculatedEquity || 0.01,
        status: "En attente" as const
      };

      setSubmittedPromises([newPromise, ...submittedPromises.filter(p => p.id !== "TX-4028")]);
      setHasSubmitted(true);
      toast.success("✨ Votre promesse d'investissement a été soumise avec succès ! Elle sera validée par notre conseil d'administration.");
    } catch (error: any) {
      console.error(error);
      toast.error(`Erreur lors de la soumission : ${error.message || "Erreur serveur"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations for live promise form
  const computedEquity = Math.round((amount / 200000000) * 100 * 100) / 100; // Exactly 200,000,000 FCFA valuation
  const estimatedAnnualInterests = Math.round(amount * 0.12); // Simulated high yield 12% from the 1% commission Pool

  // Chart data for simulated premium portfolio growth over 5 years (2026-2030)
  const growthData = [
    { year: "2026", rendement: Math.round(amount * 0.05), capitalValue: amount },
    { year: "2027", rendement: Math.round(amount * 0.12), capitalValue: Math.round(amount * 1.15) },
    { year: "2028", rendement: Math.round(amount * 0.18), capitalValue: Math.round(amount * 1.35) },
    { year: "2029", rendement: Math.round(amount * 0.24), capitalValue: Math.round(amount * 1.65) },
    { year: "2030", rendement: Math.round(amount * 0.32), capitalValue: Math.round(amount * 2.10) },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Rich Investor Header ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 text-white"
        style={{ background: "linear-gradient(135deg, #052114 0%, #0c5228 50%, #14A44D 100%)" }}
      >
        {/* Decorative Grid Accent */}
        <div className="absolute inset-0 bg-grid-white opacity-5 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400 opacity-10 blur-3xl pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 border border-amber-300/30">
              <Sparkles className="w-4.5 h-4.5 text-amber-300" />
              Ouverture de Capital · TranSen 2026
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              Devenez actionnaire de la <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                révolution de la mobilité
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              En introduisant le modèle unique au monde de <strong className="text-amber-300">seulement 1% de commission</strong> sur tous les trajets urbains et interurbains du Sénégal, TranSen capte un volume de transactions historique. Attirez la croissance à nos côtés.
            </p>

            {/* Quick platform anchors requested by USER */}
            <div className="bg-emerald-950/70 backdrop-blur border border-emerald-800/80 rounded-2xl p-4.5 mt-8">
              <p className="text-amber-400 text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Nos Plateformes Écosystème Déployées :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a 
                  href="https://app.transen.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-xs font-semibold group text-white"
                >
                  <span>App Passagers</span>
                  <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded group-hover:scale-105 transition-transform font-mono">app.transen.org</span>
                </a>
                <a 
                  href="https://compagnie.transen.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-xs font-semibold group text-white"
                >
                  <span>Portail Compagnies</span>
                  <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded group-hover:scale-105 transition-transform font-mono">compagnie.transen.org</span>
                </a>
                <a 
                  href="https://investir.transen.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-xs font-semibold group text-white font-bold"
                >
                  <span>Investisseurs</span>
                  <span className="text-[10px] text-yellow-400 bg-yellow-400/15 px-2 py-0.5 rounded font-mono">investir.transen.org</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Crucial commission highlighting ───────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="flex gap-4 items-start col-span-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Landmark className="w-7 h-7 text-emerald-700 font-extrabold" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-amber-600 uppercase bg-amber-100/60 px-2.5 py-0.5 rounded">
                  OFFRE AGRESSIVE UNIQUE AU MONDE
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  1% de Commission Fixe sur l'Urbain & l'Interurbain
                </h3>
                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                  Contrairement aux géants du transport prélevant 20% à 25%, TranSen ne prélève que <strong className="text-emerald-700">1%</strong>. Ce taux ultra-bas favorise une adoption exhaustive et instantanée par 100% des chauffeurs et compagnies au Sénégal, créant un monopole d'adoption.
                </p>
              </div>
            </div>

            <div className="bg-emerald-900/5 rounded-2xl p-6 border border-emerald-900/10 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Taux de Commission TranSen</div>
              <div className="text-5xl font-black text-emerald-800 my-2 animate-bounce">1.0%</div>
              <div className="text-xs text-emerald-700 font-bold">Uniquement, sur tout le Sénégal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Tab Interface ────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab buttons */}
          <div className="flex justify-center mb-10">
            <div className="bg-white border rounded-2xl p-1.5 flex gap-2 shadow-sm">
              <button
                onClick={() => { setActiveTab("promise"); setHasSubmitted(false); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeTab === "promise"
                    ? "bg-emerald-800 text-white shadow-lg"
                    : "text-gray-600 hover:text-emerald-800 hover:bg-gray-50"
                }`}
              >
                <DollarSign className="w-4.5 h-4.5" />
                1. Promesses d'Investissement ({submittedPromises.filter(p => p.status === "En attente").length} Actives)
              </button>
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeTab === "portfolio"
                    ? "bg-emerald-800 text-white shadow-lg"
                    : "text-gray-600 hover:text-emerald-800 hover:bg-gray-50"
                }`}
              >
                <PieChart className="w-4.5 h-4.5" />
                2. Simulateur de Portefeuille Validé (v2026)
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── TAB 1: SUBMIT PROMISE ─────────────────────────────────────── */}
            {activeTab === "promise" && (
              <motion.div
                key="promise-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid lg:grid-cols-12 gap-8 items-start"
              >
                {/* Left Side: Submission space form */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
                  {hasSubmitted ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-18 h-18 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Merci pour votre promesse !</h2>
                      <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Votre intention d'acquérir <strong className="text-emerald-700">{(amount / 500).toLocaleString("fr-FR")} actions</strong> (à 500 FCFA l'action) pour un total de <strong className="text-emerald-700">{amount.toLocaleString("fr-FR")} FCFA</strong> a été enregistrée à notre registre décentralisé. Retrouvez cette promesse listée sous statut <span className="text-amber-600 font-bold font-mono bg-amber-50 px-2 py-0.5 rounded">En attente</span> sur l'onglet Portefeuille !
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setHasSubmitted(false)}
                          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                        >
                          En soumettre une autre
                        </button>
                        <button
                          onClick={() => setActiveTab("portfolio")}
                          className="px-6 py-3 rounded-xl bg-emerald-800 text-white text-sm font-semibold hover:bg-emerald-900 transition-all shadow-md flex items-center gap-2"
                        >
                          Consulter mon Portefeuille <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmitPromise} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                          Soumettre une promesse d'investissement
                        </h2>
                        <p className="text-sm text-gray-400">
                          Tous les dépôts d'intentions sont d'abord instruits pour s'assurer de l'alignement KYC de nos contributeurs.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Nom Complet ou Entité</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: West Africa Capital / Dr. Diallo"
                            value={investorName}
                            onChange={(e) => setInvestorName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Adresse Email</label>
                          <input
                            type="email"
                            required
                            placeholder="investisseur@example.com"
                            value={investorEmail}
                            onChange={(e) => setInvestorEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-gray-300"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Téléphone (avec indicatif)</label>
                          <input
                            type="tel"
                            placeholder="+221 77..."
                            value={investorPhone}
                            onChange={(e) => setInvestorPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-gray-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Type de Profil Financier</label>
                          <select
                            value={investorType}
                            onChange={(e) => setInvestorType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-600 focus:outline-none bg-white transition-all"
                          >
                            <option value="Angel">Business Angel Privé</option>
                            <option value="VC">Société de Capital Risque (VC)</option>
                            <option value="Compagnie">Compagnie de Transport Partenaire</option>
                            <option value="Institutionnel">Fonds d'investissement Institutionnel</option>
                          </select>
                        </div>
                      </div>

                      {/* Interactive Amount Picker */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                            Montant de la Promesse (FCFA)
                          </label>
                          <span className="text-xl font-black text-emerald-800">
                            {amount.toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100000"
                          max="50000000"
                          step="100000"
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>100 000 FCFA Min</span>
                          <span>25 000 000 FCFA</span>
                          <span>50 000 000 FCFA Max</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-start gap-3">
                        <input type="checkbox" required className="mt-1 accent-emerald-700 cursor-pointer" />
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          Je confirme solennellement que ce montant de promesse n'est pas assorti de conditions suspensives d'origine criminelle et que s'il est validé d'une offre d'achat de parts, je recevrai le Term-Sheet officiel de TranSen en 2026. *
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 text-white font-bold text-sm tracking-wide transition-all hover:shadow-xl hover:shadow-emerald-900/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${
                          isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Traitement en cours...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Soumettre ma promesse d'investissement
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Right Side: Actionable dynamic returns calculations based on 1% commission model */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-emerald-950 text-white rounded-3xl p-8 border border-emerald-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 opacity-5 blur-2xl pointer-events-none" />
                    
                    <h3 className="text-md font-bold text-amber-400 mb-6 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-4.5 h-4.5" />
                      Simulateur Équité & Dividendes
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <div className="text-white/60 text-xs uppercase font-mono tracking-wider">Parts de Capital Transen Projetées</div>
                        <div className="text-4xl font-extrabold text-white mt-1">
                          {computedEquity}% <span className="text-xs text-amber-300 font-normal">estimé</span>
                        </div>
                        <div className="text-xs text-white/70 mt-3 pt-2.5 border-t border-emerald-800/60 flex flex-col gap-1.5 font-mono">
                          <div className="flex justify-between"><span className="text-white/50">Valorisation de l'App :</span> <span className="font-bold text-amber-300">200 000 000 FCFA</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Prix de l'action :</span> <span className="font-bold text-amber-300">500 FCFA</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Actions acquises :</span> <span className="font-bold text-white">{(amount / 500).toLocaleString("fr-FR")} actions</span></div>
                        </div>
                      </div>

                      <div className="border-t border-emerald-800/80 pt-5">
                        <div className="text-white/60 text-xs uppercase font-mono tracking-wider">Quote-part des Commissions Annuelles Estimée</div>
                        <div className="text-3xl font-bold mt-1 text-emerald-300">
                          +{estimatedAnnualInterests.toLocaleString("fr-FR")} FCFA <span className="text-xs text-white/70 font-normal">/ an</span>
                        </div>
                        <div className="text-xs text-white/50 mt-1">Hypothèse prudente de retour sur dividendes (12% l'an) générée sur le pool de transactions TranSen 1% commission.</div>
                      </div>

                      <div className="border-t border-emerald-800/80 pt-5 space-y-3">
                        <div className="flex gap-2.5 text-xs text-white/80">
                          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                          <span>Droit d'accès exclusif aux bilans comptables de TranSen.</span>
                        </div>
                        <div className="flex gap-2.5 text-xs text-white/80">
                          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                          <span>Liquidité assurée secondaire annuelle dès 2027.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
                    <h4 className="font-bold text-gray-900 text-sm mb-3">Statut Global de Financement 2026</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                          <span>Financement ciblé (25% du Capital)</span>
                          <span>50 000 000 FCFA</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: "67%" }}></div>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-1 font-medium font-mono text-right">67% d'intentions confirmées (33 500 000 FCFA)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 2: PORTFOLIO & HISTORIC INVESTMENT ────────────────────── */}
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Simulated dashboard banners */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Total de vos Promesses</span>
                      <div className="text-2xl font-black text-gray-900 mt-1">
                        {submittedPromises.reduce((acc, p) => acc + p.amount, 0).toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold text-xs mt-3 bg-emerald-50 px-2.5 py-1 rounded self-start">
                      {submittedPromises.length} Promesses enregistrées
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Dont Montant validé</span>
                      <div className="text-2xl font-black text-emerald-800 mt-1">
                        {(15000000).toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                    <span className="text-amber-700 font-bold text-xs mt-3 bg-amber-50 px-2.5 py-1 rounded self-start">
                      Séquence d'appel de fonds activée
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Valorisation Estimée de vos parts</span>
                      <div className="text-2xl font-black text-gray-900 mt-1">
                        - FCFA
                      </div>
                    </div>
                    <span className="text-gray-400 font-semibold text-xs mt-3">
                      En attente de cotation de capital
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Dividendes trimestriels projetés</span>
                      <div className="text-2xl font-black text-emerald-800 mt-1">
                        +{(submittedPromises.reduce((acc, p) => acc + p.amount, 0) * 0.03).toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold text-xs mt-3">
                      Paiement automatique via SenePay
                    </span>
                  </div>
                </div>

                {/* Grid chart + list view */}
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Interactive growth chart */}
                  <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Projection de Croissance Financière</h3>
                        <p className="text-xs text-gray-400">Simulation de rendements sur 5 ans basés sur votre allocation de promesses actuelles</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 font-mono text-xs px-3 py-1 rounded-lg border border-emerald-100 font-semibold">
                        Modèle 1% Urbain & Interurbain
                      </div>
                    </div>

                    <div className="h-72 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={growthData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRendement" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                          <Tooltip 
                            formatter={(value: any) => [`${Number(value).toLocaleString("fr-FR")} FCFA`, "Rendement annuel Simulé"]}
                            contentStyle={{ backgroundColor: "#111827", borderRadius: "12px", border: "none", color: "#fff" }}
                            labelStyle={{ color: "#fbbf24", fontWeight: "bold" }}
                          />
                          <Area type="monotone" dataKey="rendement" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRendement)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Submitted promises status tracker */}
                  <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4">
                    <h3 className="font-bold text-gray-900 text-md">Registre de vos promesses</h3>
                    <div className="space-y-3">
                      {submittedPromises.map((p) => (
                        <div key={p.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100/80 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-gray-400 font-bold">{p.id}</span>
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              p.status === "Validé" 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-amber-100 text-amber-800 animate-pulse"
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {p.amount.toLocaleString("fr-FR")} FCFA
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {p.type} · parts d'équité estimées : {p.equity}%
                            </div>
                          </div>
                          <div className="text-[9px] text-gray-400 text-right mt-1">
                            Date: {p.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FAQ block or security notice for investors ───────────────────── */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-4">Questions Fréquentes des Investisseurs</h2>
            <p className="text-gray-400 text-sm">Ce que vous devez savoir avant de soumettre vos intentions.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h4 className="font-bold text-amber-300">Quelle est la structure légale de TranSen en 2026 ?</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                TranSen est structuré en Société Anonyme (S.A.) de droit sénégalais au capital social réajusté en 2026. L'investissement direct confère des actions ordinaires ouvrant droit à dividende et vote.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-amber-300">Comment fonctionne le reversement des dividendes ?</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Le prélèvement de 1% de commission sur l'écosystème urbain et interurbain est centralisé en temps réel sur SenePay et redistribué trimestriellement au prorata des parts détenues.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-amber-300">Les promesses d'investissement sont-elles contraignantes ?</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Non, une promesse d'investissement n'engage légalement le signataire qu'à la signature finale du Term-Sheet après la période de validation KYC et de revue des comptes.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-amber-300">Pourquoi limiter le nombre de places par transporteur à 60 ?</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Nous optimisons le transport interurbain par autocars de grande capacité limités à 60 chaises afin d'assurer de hauts standards de confort, d'assurance et de sécurité réglementés.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
