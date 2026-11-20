import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  TrendingUp, ShieldCheck, Landmark, Sparkles, ExternalLink,
  CheckCircle2, Send, BarChart3, Layers, Building2, Users, Mail, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  getPublicInvestmentStats,
  sendContactMessage,
  type PublicFundraisingStats
} from "../services/api";
import { SpotlightCard, Reveal } from "../components/fx";

const PHASE1_TARGET = 217797000;
const PHASE1_TIGHT = 104327000;

const SCENARIOS = {
  conservateur: { label: "Conservateur", mult: 1.61, tri: "17,3 %", arrY3: "521,0 M F", exit: "3× ARR" },
  central: { label: "Central (Réf.)", mult: 2.99, tri: "44,1 %", arrY3: "723,6 M F", exit: "4× ARR" },
  optimiste: { label: "Optimiste", mult: 6.28, tri: "84,5 %", arrY3: "1 013,0 M F", exit: "6× ARR" },
} as const;

export function Investir() {
  const [stats, setStats] = useState<PublicFundraisingStats | null>(null);
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("central");
  const [shares, setShares] = useState<number>(200);

  // Institutional Data Room quick request
  const [instName, setInstName] = useState("");
  const [instOrg, setInstOrg] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instTicket, setInstTicket] = useState("5 M – 25 M FCFA (Business Angel)");
  const [instMessage, setInstMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPublicInvestmentStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const amountFcfa = shares * 500;
  const activeSc = SCENARIOS[scenario];
  const livePledged = stats?.totalAmountPledged ?? 0;
  const livePct = Math.min(100, (livePledged / PHASE1_TARGET) * 100);

  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !instEmail.trim() || !instPhone.trim()) {
      toast.error("Veuillez renseigner votre nom, votre e-mail et votre téléphone.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendContactMessage({
        nom: instOrg.trim() ? `${instName.trim()} (${instOrg.trim()})` : instName.trim(),
        email: instEmail.trim(),
        telephone: instPhone.trim(),
        sujet: "INVESTISSEUR_INSTITUTIONNEL",
        message: `[DATA ROOM PHASE 1 — ${instTicket}] ${instMessage.trim() || "Demande d'accès au Business Plan complet et au modèle financier 3 ans."}`,
      });
      toast.success("Demande Data Room transmise ! Mouhamadou Fadilou Ndiaye vous répondra sous 24h ouvrées.");
      setInstName("");
      setInstOrg("");
      setInstEmail("");
      setInstPhone("");
      setInstMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi de votre demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#03100b] min-h-screen text-slate-100">
      {/* ── Hero Institutionnel Aurora ───────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 lg:py-24 aurora-bg noise border-b border-emerald-500/20">
        <div className="grid-fade absolute inset-0 opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="eyebrow eyebrow-gold mb-6">
                Levée Phase 1 · Amorçage 2026 · 0 Dette
              </span>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight text-white mb-6 leading-[1.08]">
                Investissez dans la{" "}
                <span className="text-gradient-gold">mobilité nationale du Sénégal</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
                Plateforme tri-modale (urbain + interurbain sur <strong className="text-white">14 régions</strong>)
                achevée à <strong className="text-emerald-300">99 %</strong>, commission disruptive de{" "}
                <strong className="text-amber-300">2 %</strong> (6× à 12× inférieure au marché) et rentabilité
                opérationnelle visée dès le <strong className="text-cyan-300">Mois 10</strong>.
              </p>

              <div className="flex flex-wrap gap-3.5 mb-8">
                <a
                  href="https://investir.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold text-sm sm:text-base"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ouvrir le Portail Investisseur Complet</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="mailto:fadiloundiaye2004@gmail.com?subject=Relations%20Investisseurs%20TranSen%20Phase%201"
                  className="btn-ghost text-sm"
                >
                  <Mail className="w-4 h-4 text-amber-300" />
                  <span>fadiloundiaye2004@gmail.com</span>
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { k: "Tour Phase 1", v: "217,8 M F", s: "Resserré : 104,3 M" },
                  { k: "TRI 3 ans", v: "44,1 %", s: "ROI Central 2,99×" },
                  { k: "LTV / CAC", v: "3,5×", s: "Payback 3,4 mois" },
                  { k: "Point Mort", v: "Mois 10", s: "Mois 5 (resserré)" },
                ].map((m) => (
                  <div key={m.k} className="glass rounded-2xl p-3.5 border border-emerald-400/20">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{m.k}</div>
                    <div className="text-lg sm:text-xl font-extrabold font-display text-amber-300 mt-1">{m.v}</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">{m.s}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Round Card */}
            <div className="lg:col-span-5">
              <div className="gradient-border rounded-3xl">
                <div className="glass-strong rounded-3xl p-6 sm:p-7 space-y-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                        Télémétrie Levée Live
                      </span>
                      <h2 className="text-xl font-extrabold text-white font-display mt-0.5">
                        Phase 1 — Intermédiation
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                      20–25 % Capital
                    </span>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-baseline flex-wrap gap-1">
                      <span className="text-2xl font-extrabold font-mono text-gradient-gold">217 797 000 FCFA</span>
                      <span className="text-xs font-mono text-slate-400">≈ 332 000 €</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 font-mono">
                      <span>Engagé : <strong className="text-amber-300">{livePledged.toLocaleString("fr-FR")} F</strong></span>
                      <span className="text-emerald-300">{livePledged > 0 ? `${livePct.toFixed(2)} %` : "Ouvert"}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-700"
                        style={{ width: `${Math.max(livePct, 3)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Seuil resserré : {PHASE1_TIGHT.toLocaleString("fr-FR")} F</span>
                      <span>Réserve cash : 19 %</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-400 block">Souscripteurs actifs</span>
                      <strong className="text-white font-mono text-base">{stats ? stats.totalInvestors : "Ouvert"}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-400 block">Action communauté</span>
                      <strong className="text-amber-300 font-mono text-base">500 FCFA</strong>
                    </div>
                  </div>

                  <a
                    href="https://investir.transen.org/#souscrire"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-emerald w-full text-sm"
                  >
                    <span>Souscrire dès 500 FCFA (Wave / OM / Free)</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Projections 3 ans + Simulateur Interactif ────────────────────── */}
      <section className="py-20 section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
            <div>
              <span className="eyebrow mb-3">Business Plan Septembre 2026</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                Trajectoire 3 ans & <span className="text-gradient-aurora">Simulation de retour</span>
              </h2>
            </div>
            <div className="inline-flex p-1 rounded-full bg-black/40 border border-white/10 gap-1">
              {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setScenario(k)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    scenario === k
                      ? "bg-gradient-to-r from-amber-300 to-amber-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {SCENARIOS[k].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: P&L Table & 3-Phase Roadmap */}
            <div className="lg:col-span-7 space-y-6">
              <SpotlightCard className="p-6 sm:p-7">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 font-display">
                  <BarChart3 className="w-5 h-5 text-amber-300" />
                  Compte de Résultat Prévisionnel 3 Ans (M FCFA · 0 Dette)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-amber-300 text-xs uppercase">
                        <th className="py-3 text-left font-sans">Indicateur</th>
                        <th className="py-3 text-right">Année 1</th>
                        <th className="py-3 text-right">Année 2</th>
                        <th className="py-3 text-right">Année 3</th>
                        <th className="py-3 text-right">Cumul 3 ans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-3 font-sans font-semibold text-white">Chiffre d'affaires</td>
                        <td className="py-3 text-right">73,3</td>
                        <td className="py-3 text-right">303,0</td>
                        <td className="py-3 text-right text-amber-300 font-bold">590,9</td>
                        <td className="py-3 text-right text-amber-300 font-bold">967,2</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-slate-300">Résultat Net</td>
                        <td className="py-3 text-right text-rose-400">-49,9</td>
                        <td className="py-3 text-right text-emerald-300">+117,2</td>
                        <td className="py-3 text-right text-emerald-300">+227,4</td>
                        <td className="py-3 text-right text-emerald-300 font-bold">+294,6</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-slate-300">Marge Nette</td>
                        <td className="py-3 text-right text-slate-400">-68 %</td>
                        <td className="py-3 text-right text-emerald-300">+39 %</td>
                        <td className="py-3 text-right text-emerald-300">+38 %</td>
                        <td className="py-3 text-right text-emerald-300">+30 %</td>
                      </tr>
                      <tr className="bg-emerald-500/10 font-bold">
                        <td className="py-3 font-sans text-white pl-2 rounded-l-lg">Trésorerie clôture</td>
                        <td className="py-3 text-right">167,9</td>
                        <td className="py-3 text-right">285,1</td>
                        <td className="py-3 text-right text-cyan-300">512,4</td>
                        <td className="py-3 text-right text-cyan-300 pr-2 rounded-r-lg">512,4</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </SpotlightCard>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { p: "Phase 1 · M1–18", t: "Intermédiation Pure", b: "217,8 M F", d: "14 régions, 15 postes, agrément DGTT (15 M FDTT), 0 actif physique." },
                  { p: "Phase 2 · A2–A3", t: "Flotte Propre", b: "868,7 M F", d: "30 urbains + 15 interurbains + 5 bus & ~53 chauffeurs salariés." },
                  { p: "Phase 3 · A3+", t: "Gares Propres", b: "≈ 3,01 Md F", d: "Gare moderne 10–25 quais, billetterie intégrée & hub colis." },
                ].map((ph) => (
                  <div key={ph.p} className="glass rounded-2xl p-5 border border-white/10">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">{ph.p}</span>
                    <h4 className="text-base font-bold text-white font-display mt-1">{ph.t}</h4>
                    <div className="text-lg font-extrabold font-mono text-amber-300 my-1.5">{ph.b}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{ph.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Simulator + Institutional Data Room Form */}
            <div className="lg:col-span-5 space-y-6">
              <SpotlightCard className="p-6 border border-amber-400/30">
                <h3 className="text-base font-bold text-amber-300 font-display flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  Simulateur Indicatif ({activeSc.label})
                </h3>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
                  <span>{shares.toLocaleString("fr-FR")} actions × 500 FCFA</span>
                  <strong className="text-white">{amountFcfa.toLocaleString("fr-FR")} FCFA</strong>
                </div>
                <input
                  type="range"
                  min={10}
                  max={20000}
                  step={10}
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg accent-amber-400 cursor-pointer mb-4"
                />
                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Multiple 3 ans</span>
                    <strong className="text-amber-300 text-base">{activeSc.mult}×</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">TRI Annuel</span>
                    <strong className="text-cyan-300 text-base">{activeSc.tri}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                    <span className="text-[10px] text-emerald-200 block">Valeur est. A3</span>
                    <strong className="text-white text-sm">{Math.round(amountFcfa * activeSc.mult).toLocaleString("fr-FR")} F</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  Projections illustratives non garanties issues du Business Plan (ARR A3 : {activeSc.arrY3}, multiple de sortie : {activeSc.exit}).
                </p>
              </SpotlightCard>

              <form onSubmit={handleInstitutionalSubmit} className="glass-strong rounded-3xl p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                    Fonds · Business Angels · Partenaires
                  </span>
                  <h3 className="text-lg font-extrabold text-white font-display mt-1">
                    Demander l'accès Data Room Complète
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nom complet *"
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    className="field-dark text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Fonds / Structure"
                    value={instOrg}
                    onChange={(e) => setInstOrg(e.target.value)}
                    className="field-dark text-sm"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="E-mail professionnel *"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    className="field-dark text-sm"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Téléphone / WhatsApp *"
                    value={instPhone}
                    onChange={(e) => setInstPhone(e.target.value)}
                    className="field-dark text-sm"
                  />
                </div>
                <select
                  value={instTicket}
                  onChange={(e) => setInstTicket(e.target.value)}
                  className="field-dark text-sm"
                >
                  <option value="5 M – 25 M FCFA (Business Angel)">5 M – 25 M FCFA (Business Angel)</option>
                  <option value="25 M – 104,3 M FCFA (Co-investisseur)">25 M – 104,3 M FCFA (Co-investisseur)</option>
                  <option value="104,3 M – 217,8 M FCFA (Lead Investor Phase 1)">104,3 M – 217,8 M FCFA (Lead Investor Phase 1)</option>
                </select>
                <textarea
                  rows={3}
                  placeholder="Questions ou documents souhaités (BP PDF, modèle Excel 3 ans, rendez-vous Fondateur)..."
                  value={instMessage}
                  onChange={(e) => setInstMessage(e.target.value)}
                  className="field-dark text-sm"
                />
                <button type="submit" disabled={isSubmitting} className="btn-gold w-full text-sm cursor-pointer disabled:opacity-60">
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Envoi en cours..." : "Demander la Data Room"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gouvernance & Cadre Juridique DGTT ───────────────────────────── */}
      <section className="py-16 section-dark border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Reveal>
              <div className="glass rounded-2xl p-6 h-full">
                <ShieldCheck className="w-7 h-7 text-emerald-300 mb-3" />
                <h4 className="text-base font-bold text-white font-display mb-2">Conformité DGTT & Capital ≥ 51 % SN</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Structuration en société (SARL/SUARL ou SA) à capital ≥ 51 % national sénégalais pour l'obtention de
                  l'agrément DGTT VTC (Décret n°2024-847, caution 15 M FCFA au FDTT).
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="glass rounded-2xl p-6 h-full">
                <Landmark className="w-7 h-7 text-amber-300 mb-3" />
                <h4 className="text-base font-bold text-white font-display mb-2">Gouvernance & Audit Indépendant</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Reporting mensuel (MRR, cash, KPI opérationnels), bilan trimestriel, suivi budgété vs réalisé,
                  audit annuel indépendant et siège observateur/conseil.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="glass rounded-2xl p-6 h-full">
                <Users className="w-7 h-7 text-cyan-300 mb-3" />
                <h4 className="text-base font-bold text-white font-display mb-2">Portail Dédié investir.transen.org</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Retrouvez l'intégralité du dossier investisseur, le suivi KYC et votre certificat nominatif sur notre portail dédié.
                </p>
                <a
                  href="https://investir.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hover:text-amber-200"
                >
                  <span>Accéder à investir.transen.org</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
