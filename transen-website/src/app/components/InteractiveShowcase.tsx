import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calculator, TrendingUp, Sparkles, Navigation, Clock, MapPin, 
  ChevronRight, Star, Shield, ArrowRight, DollarSign, Percent
} from "lucide-react";

/* =========================================================================
   1. COMMISSION CALCULATOR COMPONENT
   ========================================================================= */
export function CommissionCalculator() {
  const [dailyTrips, setDailyTrips] = useState(25);
  const [avgTicketPrice, setAvgTicketPrice] = useState(4500);

  // Standard platform fee (e.g. 15%) vs TranSen Fee (1%)
  const standardFeeRate = 0.15;
  const transenFeeRate = 0.01;

  const totalVolumeDay = dailyTrips * avgTicketPrice;
  const standardCost = totalVolumeDay * standardFeeRate;
  const transenCost = totalVolumeDay * transenFeeRate;
  const dailySavings = standardCost - transenCost;
  const monthlySavings = dailySavings * 30;
  const yearlySavings = dailySavings * 365;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl relative overflow-hidden" id="commission-calc">
      {/* Absolute design accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-emerald-600 animate-pulse" />
        </div>
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-600 font-bold">Outil Syndicats & Coops</span>
          <h3 className="text-xl font-extrabold text-gray-900 leading-none mt-0.5">Calculateur d'Économie Net</h3>
        </div>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        Calculez la plus-value de notre tarif unique à <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs select-all">1% de commission</span> comparé au taux standard du marché (15%). Voyez le capital supplémentaire récupéré par vos chauffeurs !
      </p>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Courses vendues par jour
              </label>
              <span className="px-3 py-1 bg-gray-50 text-emerald-700 font-mono text-sm font-bold rounded-lg border border-gray-100">
                {dailyTrips} billets / jour
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={dailyTrips}
              onChange={(e) => setDailyTrips(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>5 places</span>
              <span>100 places</span>
              <span>200 places</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">
                Prix moyen d'un trajet
              </label>
              <span className="px-3 py-1 bg-gray-50 text-emerald-700 font-mono text-sm font-bold rounded-lg border border-gray-100">
                {avgTicketPrice.toLocaleString()} FCFA
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={avgTicketPrice}
              onChange={(e) => setAvgTicketPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-gold focus:outline-none"
              style={{ accentColor: "var(--brand-gold)" }}
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>1 000 FCFA</span>
              <span>7 500 FCFA</span>
              <span>15 000 FCFA</span>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6">
          <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-850 flex flex-col justify-between h-full relative">
            <div className="absolute top-3 right-3">
              <Percent className="w-12 h-12 text-slate-800 shrink-0" />
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#FFD700]/70 uppercase block">Gains additionnels générés</span>
              <div className="text-3xl md:text-4xl font-extrabold text-white mt-1 select-all tracking-tight font-mono">
                +{monthlySavings.toLocaleString()} <span className="text-sm text-amber-400">FCFA/mois</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Soit un bénéfice préservé à l'année de <strong className="text-white bg-emerald-950 px-1 rounded">{yearlySavings.toLocaleString()} FCFA</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-850">
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl">
                <span className="text-[10px] font-mono text-red-400 block">Frais Standard (15%)</span>
                <span className="text-sm font-bold text-red-200">{standardCost.toLocaleString()} FCFA/j</span>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                <span className="text-[10px] font-mono text-emerald-400 block">Frais TranSen (1%)</span>
                <span className="text-md font-bold text-emerald-300">{transenCost.toLocaleString()} FCFA/j</span>
              </div>
            </div>

            <div className="mt-5 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Revenu Journalier Brut :</span>
              <span>{totalVolumeDay.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   2. SENEGAL INTERACTIVE SVG ROUTE MAP COMPONENT
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
  { id: "dk", name: "Dakar", x: 12, y: 52, details: { avgTime: "---", avgPrice: "---", partners: 200, activity: "Hub Principal" } },
  { id: "th", name: "Thiès", x: 26, y: 50, details: { avgTime: "1h 15m", avgPrice: "1 200 FCFA", partners: 45, activity: "Forte" } },
  { id: "sl", name: "Saint-Louis", x: 38, y: 18, details: { avgTime: "4h 00m", avgPrice: "4 000 FCFA", partners: 35, activity: "Saisonnière" } },
  { id: "tb", name: "Touba", x: 44, y: 46, details: { avgTime: "2h 45m", avgPrice: "3 000 FCFA", partners: 60, activity: "Intense" } },
  { id: "kl", name: "Kaolack", x: 41, y: 64, details: { avgTime: "3h 30m", avgPrice: "3 500 FCFA", partners: 40, activity: "Haute" } },
  { id: "tm", name: "Tambacounda", x: 74, y: 60, details: { avgTime: "7h 30m", avgPrice: "7 000 FCFA", partners: 18, activity: "Moyenne" } },
  { id: "zg", name: "Ziguinchor", x: 32, y: 88, details: { avgTime: "9h 00m (Bateau/Route)", avgPrice: "8 500 FCFA", partners: 12, activity: "Stable" } },
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden" id="interactive-map">
      {/* Decorative starry layout in slate bg */}
      <div className="absolute inset-0 opacity-1 pointer-events-none" style={{ backgroundImage: "radial-gradient(ellipse at center, #1e293b 0%, transparent 80%)" }} />
      <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-900 rounded-full">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Visualisation Satellite 🇸🇳</span>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Navigation className="w-5 h-5 text-amber-400" />
          Réseau Fluvial Interurbain
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
          Explorez de manière interactive nos axes de voyage, fréquences de partenaires d'Allô Dakar & Compagnies certifiées. Cliquez sur n'importe quel hub pour sonder les temps.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-center">
        {/* SVG Map (Center Column) */}
        <div className="lg:col-span-7 relative bg-slate-950 rounded-2xl p-4 border border-slate-850 h-[320px] flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full max-h-[290px] drop-shadow-xl select-none overflow-visible">
            {/* Senegal stylized boundary simplified backdrops */}
            <path 
              d="M 5,50 Q 15,10 40,15 T 75,25 T 95,50 T 70,80 T 35,95 Z" 
              fill="rgba(255,255,255,0.015)" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="0.5" 
            />

            {/* Simulated Casamance bridge river borders */}
            <line x1="20" y1="76" x2="60" y2="76" stroke="rgba(255,215,0,0.08)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Connection Lanes */}
            {CONNECTIONS.map((conn, idx) => {
              const start = CITIES.find(c => c.id === conn.from)!;
              const end = CITIES.find(c => c.id === conn.to)!;
              return (
                <g key={idx}>
                  {/* Outer glow lane */}
                  <line 
                    x1={start.x} 
                    y1={start.y} 
                    x2={end.x} 
                    y2={end.y} 
                    stroke="rgba(16,185,129,0.15)" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                  />
                  {/* Animating dash path */}
                  <line 
                    x1={start.x} 
                    y1={start.y} 
                    x2={end.x} 
                    y2={end.y} 
                    stroke="var(--brand-green)" 
                    strokeWidth="0.8" 
                    strokeDasharray="4,8" 
                    className="animate-[dash_10s_linear_infinite]" 
                    strokeLinecap="round"
                    style={{
                      strokeDashoffset: idx % 2 === 0 ? 100 : -100
                    }}
                  />
                </g>
              );
            })}

            {/* Cities Pin Dots */}
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
                    r={isSelected ? 4.5 : isHovered ? 3.5 : 2.5} 
                    fill={isSelected ? "var(--brand-gold)" : "var(--brand-green)"} 
                    className="transition-all duration-300"
                  />
                  {isSelected && (
                    <circle 
                      cx={city.x} 
                      cy={city.y} 
                      r="7" 
                      fill="none" 
                      stroke="var(--brand-gold)" 
                      strokeWidth="0.5" 
                      className="animate-ping" 
                    />
                  )}
                  {/* Text label */}
                  <text 
                    x={city.x} 
                    y={city.y - (isSelected ? 6 : 4.5)} 
                    fontSize={isSelected ? "3.2" : "2.5"} 
                    fontWeight={isSelected ? "bold" : "bold"}
                    fill={isSelected ? "var(--brand-gold)" : "#ffffff"} 
                    textAnchor="middle"
                    className="font-mono pointer-events-none drop-shadow"
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Informative Inspection Sidebar */}
        <div className="lg:col-span-5 h-[320px] flex flex-col justify-between">
          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[10px] font-mono tracking-widest text-[#FFD700] uppercase font-bold">INFO MODULE</span>
                <span className="text-[10px] text-zinc-500 font-mono">Détails de Trajet</span>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-md font-bold text-white tracking-tight">{selectedCity.name} (Hub Transit)</h4>
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed mt-2.5">
                Desserte essentielle pour les liaisons de ralliement interurbaines du Sénégal. Les départs réguliers incluent les transports certifiés et de proximité.
              </p>

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-900 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Activité Générale :</span>
                  <span className="text-amber-400 font-semibold">{selectedCity.details.activity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Chauffeurs Certifiés :</span>
                  <span className="text-emerald-400 font-bold">{selectedCity.details.partners} chauffeurs</span>
                </div>
                {selectedCity.id !== "dk" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Temps estimé (depuis Dakar) :</span>
                      <span className="text-white font-medium">{selectedCity.details.avgTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tarif passager conseillé :</span>
                      <span className="text-white font-medium">{selectedCity.details.avgPrice}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold font-mono">
              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
              <span>Chauffeurs certifiés KYC · GPS Tracking Actif</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Keyframes injected globally for simplicity so the map animates */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 1000;
          }
        }
      `}</style>
    </div>
  );
}
