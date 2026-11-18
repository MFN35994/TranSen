import { useState } from "react";
import { motion } from "motion/react";
import {
  Calculator, Navigation, MapPin, Star, Percent, Sparkles, TrendingUp, Activity, ShieldCheck
} from "lucide-react";
import { SpotlightCard } from "./fx";

/* =========================================================================
   1. COMMISSION CALCULATOR COMPONENT — AURORA FINTECH INSTRUMENT
   ========================================================================= */
export function CommissionCalculator() {
  const [dailyTrips, setDailyTrips] = useState(35);
  const [avgTicketPrice, setAvgTicketPrice] = useState(4500);

  const standardFeeRate = 0.15;
  const transenFeeRate = 0.02;

  const totalVolumeDay = dailyTrips * avgTicketPrice;
  const standardCost = totalVolumeDay * standardFeeRate;
  const transenCost = totalVolumeDay * transenFeeRate;
  const dailySavings = standardCost - transenCost;
  const monthlySavings = dailySavings * 30;
  const yearlySavings = dailySavings * 365;

  return (
    <SpotlightCard className="p-6 sm:p-10 glass-strong relative overflow-hidden" style={{ borderRadius: "28px" }}>
      <div id="commission-calc" className="relative z-10">
        {/* Ambient corner glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="icon-tile">
              <Calculator className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono tracking-[0.18em] text-emerald-300 font-bold block">
                Simulateur Syndicats, GIE & Compagnies
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-display">
                Calculateur d'Économie Net <span className="text-gradient-gold">98% Reversés</span>
              </h3>
            </div>
          </div>
          <span className="eyebrow eyebrow-gold">
            2% TranSen vs 15% Marché
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed mb-8 max-w-3xl">
          Simulez en temps réel l'impact financier de notre commission unique à{" "}
          <span className="font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-md font-mono text-xs">
            2% SEULEMENT
          </span>{" "}
          face aux plateformes classiques (15% à 20%). Visualisez la trésorerie nette conservée par vos chauffeurs et votre flotte.
        </p>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 bg-white/[0.025] border border-white/10 rounded-2xl p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="daily-trips-range" className="text-sm font-semibold text-slate-200">
                  Billets ou courses par jour
                </label>
                <span className="px-3.5 py-1 bg-emerald-500/15 text-emerald-300 font-mono text-sm font-bold rounded-xl border border-emerald-400/30 shadow-[0_0_16px_rgba(16,185,129,0.2)]">
                  {dailyTrips} trajets / j
                </span>
              </div>
              <input
                id="daily-trips-range"
                type="range"
                min="5"
                max="200"
                step="5"
                value={dailyTrips}
                onChange={(e) => setDailyTrips(parseInt(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>5 / jour</span>
                <span>100 / jour</span>
                <span>200 / jour</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="ticket-price-range" className="text-sm font-semibold text-slate-200">
                  Tarif moyen du billet / course
                </label>
                <span className="px-3.5 py-1 bg-amber-500/15 text-amber-300 font-mono text-sm font-bold rounded-xl border border-amber-400/35 shadow-[0_0_16px_rgba(245,184,61,0.2)]">
                  {avgTicketPrice.toLocaleString()} FCFA
                </span>
              </div>
              <input
                id="ticket-price-range"
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={avgTicketPrice}
                onChange={(e) => setAvgTicketPrice(parseInt(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>1 000 FCFA</span>
                <span>7 500 FCFA</span>
                <span>15 000 FCFA</span>
              </div>
            </div>

            {/* Visual comparative efficiency bar */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-300 font-bold">Part reversée au transporteur : 98%</span>
                <span className="text-amber-300">Commission TranSen : 2%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex p-0.5">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                  style={{ width: "98%" }}
                />
                <div className="h-full rounded-r-full bg-amber-400" style={{ width: "2%" }} />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6">
            <div className="gradient-border rounded-2xl h-full">
              <div className="bg-[#04140e]/95 text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden">
                <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none">
                  <Percent className="w-36 h-36 text-emerald-300" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-mono tracking-widest text-amber-300 uppercase font-bold">
                    <TrendingUp className="w-3.5 h-3.5" /> Trésorerie Nette Sauvegardée
                  </div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-3 select-all tracking-tight font-display text-gradient-gold">
                    +{monthlySavings.toLocaleString()}{" "}
                    <span className="text-base sm:text-lg font-mono text-amber-200">FCFA/mois</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Soit un capital additionnel conservé sur 12 mois de{" "}
                    <strong className="text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-md font-mono">
                      +{yearlySavings.toLocaleString()} FCFA / an
                    </strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 mt-6 pt-6 border-t border-white/10">
                  <div className="p-3.5 bg-rose-500/10 border border-rose-400/25 rounded-xl">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 block">
                      Commission Classique (15%)
                    </span>
                    <span className="text-base sm:text-lg font-extrabold font-mono text-rose-200 mt-1 block">
                      -{standardCost.toLocaleString()} F/j
                    </span>
                  </div>
                  <div className="p-3.5 bg-emerald-500/15 border border-emerald-400/35 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block">
                      Commission TranSen (2%)
                    </span>
                    <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-200 mt-1 block">
                      {transenCost.toLocaleString()} F/j
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 text-xs text-slate-400 font-mono flex items-center justify-between">
                  <span>Volume Brut Quotidien :</span>
                  <span className="text-white font-bold">{totalVolumeDay.toLocaleString()} FCFA / jour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

/* =========================================================================
   2. SENEGAL INTERACTIVE SVG ROUTE MAP COMPONENT — HOLOGRAPHIC RADAR
   ========================================================================= */

interface PointCity {
  id: string;
  name: string;
  x: number;
  y: number;
  details: {
    avgTime: string;
    avgPrice: string;
    partners: number;
    activity: string;
  };
}

const CITIES: PointCity[] = [
  { id: "dk", name: "Dakar", x: 12, y: 52, details: { avgTime: "Hub Central", avgPrice: "Départ 0 km", partners: 200, activity: "Hub Principal" } },
  { id: "th", name: "Thiès", x: 26, y: 50, details: { avgTime: "1h 15m", avgPrice: "1 200 FCFA", partners: 45, activity: "Très Forte" } },
  { id: "sl", name: "Saint-Louis", x: 38, y: 18, details: { avgTime: "4h 00m", avgPrice: "4 000 FCFA", partners: 35, activity: "Haute" } },
  { id: "tb", name: "Touba", x: 44, y: 46, details: { avgTime: "2h 45m", avgPrice: "3 000 FCFA", partners: 60, activity: "Intense" } },
  { id: "kl", name: "Kaolack", x: 41, y: 64, details: { avgTime: "3h 30m", avgPrice: "3 500 FCFA", partners: 40, activity: "Haute" } },
  { id: "tm", name: "Tambacounda", x: 76, y: 60, details: { avgTime: "7h 30m", avgPrice: "7 000 FCFA", partners: 18, activity: "Soutenue" } },
  { id: "zg", name: "Ziguinchor", x: 32, y: 88, details: { avgTime: "9h 00m", avgPrice: "8 500 FCFA", partners: 12, activity: "Continue" } },
];

const CONNECTIONS = [
  { from: "dk", to: "th", duration: "1h 15", price: "1 200" },
  { from: "th", to: "sl", duration: "2h 45", price: "2 800" },
  { from: "th", to: "tb", duration: "1h 30", price: "1 800" },
  { from: "th", to: "kl", duration: "2h 15", price: "2 300" },
  { from: "kl", to: "tm", duration: "4h 00", price: "3 500" },
  { from: "kl", to: "zg", duration: "5h 30", price: "5 000" },
];

export function SenegalRouteMap() {
  const [selectedCity, setSelectedCity] = useState<PointCity>(CITIES[0]);
  const [hoveredCity, setHoveredCity] = useState<PointCity | null>(null);

  return (
    <SpotlightCard className="p-6 sm:p-10 glass-strong text-white relative overflow-hidden" style={{ borderRadius: "28px" }}>
      <div id="interactive-map" className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="icon-tile icon-tile-gold">
              <Navigation className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono tracking-[0.18em] text-cyan-300 font-bold block">
                Cartographie Télémétrique Interurbaine
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-display">
                Corridors Nationaux <span className="text-gradient-aurora">& Hubs Connectés</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-400/35 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
              Radar Satellite Live 🇸🇳
            </span>
          </div>
        </div>

        {/* Quick City Selector Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CITIES.map((city) => {
            const active = selectedCity.id === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,184,61,0.5)]"
                    : "bg-white/[0.04] text-slate-300 border border-white/10 hover:border-emerald-400/40 hover:text-white"
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Holographic SVG Radar Map */}
          <div className="lg:col-span-7 relative bg-[#020c08] rounded-2xl p-5 border border-emerald-400/25 h-[350px] flex items-center justify-center overflow-hidden shadow-inner">
            <div className="grid-fade absolute inset-0 opacity-75 pointer-events-none" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 35% 50%, rgba(16,185,129,0.16), rgba(34,211,238,0.06) 45%, transparent 75%)",
              }}
            />

            <svg viewBox="0 0 100 100" className="w-full h-full max-h-[310px] select-none overflow-visible relative z-10">
              <defs>
                <linearGradient id="auroraLane" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#f5b83d" />
                </linearGradient>
              </defs>

              {/* Stylized Senegal Contour */}
              <path
                d="M 5,50 Q 15,10 40,15 T 75,25 T 95,50 T 70,80 T 35,95 Z"
                fill="rgba(16,185,129,0.04)"
                stroke="rgba(52,211,153,0.22)"
                strokeWidth="0.6"
              />

              {/* Radar concentric rings around Dakar */}
              <circle cx="12" cy="52" r="18" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="0.35" strokeDasharray="2 2" />
              <circle cx="12" cy="52" r="36" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.35" strokeDasharray="2 2" />

              {/* Connection Corridors */}
              {CONNECTIONS.map((conn, idx) => {
                const start = CITIES.find((c) => c.id === conn.from)!;
                const end = CITIES.find((c) => c.id === conn.to)!;
                return (
                  <g key={idx}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="rgba(52,211,153,0.22)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="url(#auroraLane)"
                      strokeWidth="0.95"
                      strokeDasharray="4,7"
                      className="animate-[dash_10s_linear_infinite]"
                      strokeLinecap="round"
                      style={{
                        strokeDashoffset: idx % 2 === 0 ? 100 : -100,
                      }}
                    />
                  </g>
                );
              })}

              {/* City Hub Nodes */}
              {CITIES.map((city) => {
                const isSelected = selectedCity.id === city.id;
                const isHovered = hoveredCity?.id === city.id;
                return (
                  <g
                    key={city.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedCity(city)}
                    onMouseEnter={() => setHoveredCity(city)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={isSelected ? 4.8 : isHovered ? 3.8 : 2.8}
                      fill={isSelected ? "#f5b83d" : "#34d399"}
                      className="transition-all duration-300"
                    />
                    {isSelected && (
                      <>
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r="8"
                          fill="none"
                          stroke="#f5b83d"
                          strokeWidth="0.6"
                          className="animate-ping"
                        />
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r="10"
                          fill="none"
                          stroke="rgba(245,184,61,0.35)"
                          strokeWidth="0.4"
                        />
                      </>
                    )}
                    <text
                      x={city.x}
                      y={city.y - (isSelected ? 6.5 : 4.8)}
                      fontSize={isSelected ? "3.4" : "2.7"}
                      fontWeight="bold"
                      fill={isSelected ? "#fde68a" : "#ecfdf5"}
                      textAnchor="middle"
                      className="font-mono pointer-events-none"
                    >
                      {city.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Telemetry Inspection HUD */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-[#04140e]/90 border border-emerald-400/25 p-6 rounded-2xl h-full flex flex-col justify-between relative overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-cyan-400/10 blur-2xl" />
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-[11px] font-mono tracking-[0.18em] text-amber-300 uppercase font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-300" /> Télémétrie Hub
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30">
                    ONLINE · GPS
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-300 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-white font-display tracking-tight">
                      {selectedCity.name}
                    </h4>
                    <span className="text-xs font-mono text-cyan-300">Gare Interurbaine & VTC</span>
                  </div>
                </div>

                <p className="text-slate-300/90 text-xs sm:text-sm leading-relaxed mt-3">
                  Nœud stratégique interconnecté au réseau national TranSen : départs programmés en bus, courses VTC Allô Dakar et fret colis Yobanté.
                </p>

                <div className="space-y-2.5 mt-5 pt-4 border-t border-white/10 font-mono text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-slate-400">Flux & Demande :</span>
                    <span className="text-amber-300 font-bold">{selectedCity.details.activity}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-slate-400">Unités & Chauffeurs KYC :</span>
                    <span className="text-emerald-300 font-bold">{selectedCity.details.partners} actifs</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-slate-400">Liaison depuis Dakar :</span>
                    <span className="text-white font-bold">{selectedCity.details.avgTime}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-slate-400">Tarif Moyen Indicatif :</span>
                    <span className="text-cyan-300 font-bold">{selectedCity.details.avgPrice}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 text-[11px] text-emerald-300 flex items-center gap-2 font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Certifié KYC · Billetterie QR SenePay 2%</span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: 1000;
            }
          }
        `}</style>
      </div>
    </SpotlightCard>
  );
}
