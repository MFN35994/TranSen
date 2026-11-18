import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { searchTripsApi } from "../services/api";

interface LiveDepartureItem {
  from: string;
  to: string;
  time: string;
  company: string;
  seats: number;
  paid: boolean;
}

const FALLBACK_DEPARTURES: LiveDepartureItem[] = [
  { from: "Dakar", to: "Saint-Louis", time: "08:00", company: "MACHALLA Transport", seats: 14, paid: true },
  { from: "Thiès", to: "Touba", time: "09:30", company: "TranSen Express", seats: 6, paid: true },
  { from: "Kaolack", to: "Ziguinchor", time: "10:00", company: "Sénégal Voyages", seats: 18, paid: false },
  { from: "Dakar", to: "Tambacounda", time: "11:00", company: "MACHALLA Transport", seats: 4, paid: true },
  { from: "Dakar", to: "Kaolack", time: "13:00", company: "Dakar Bus VIP", seats: 9, paid: true },
];

export function LiveDepartures() {
  const [departures, setDepartures] = useState<LiveDepartureItem[]>(FALLBACK_DEPARTURES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    searchTripsApi("", "", today)
      .then((trips) => {
        if (Array.isArray(trips) && trips.length > 0) {
          const liveItems: LiveDepartureItem[] = trips.slice(0, 12).map((t) => ({
            from: t.pickupLocation || "Dakar",
            to: t.dropoffLocation || "Touba",
            time: t.scheduledTime && t.scheduledTime.includes("T") ? t.scheduledTime.split("T")[1].slice(0, 5) : "08:00",
            company: t.companyName || "Compagnie TranSen",
            seats: t.availableSeats ?? 10,
            paid: true,
          }));
          setDepartures(liveItems);
          setIndex(0);
        }
      })
      .catch(() => {
        // Fallback silencieux vers les liaisons nationales
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setIndex((i) => (i + 1) % departures.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [departures.length]);

  const d = departures[index] || FALLBACK_DEPARTURES[0];

  return (
    <div className="relative bg-[#04160f]/95 border-y border-emerald-400/20 backdrop-blur-xl py-3.5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-amber-500/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-hidden relative z-10">
        <div className="flex items-center gap-2.5 flex-shrink-0 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <Radio className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-emerald-300 text-[11px] font-mono whitespace-nowrap tracking-[0.15em] font-bold uppercase">
            Télémétrie Départs Live
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${d.company}`}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 flex-1 min-w-0 overflow-x-auto no-scrollbar"
          >
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 whitespace-nowrap shrink-0 font-bold">
              {d.company}
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap shrink-0 font-semibold text-white">
              <span>{d.from}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-200">{d.to}</span>
            </span>
            <span className="text-slate-600 shrink-0">•</span>
            <span className="whitespace-nowrap shrink-0 font-mono text-xs text-slate-300 bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/10">
              DÉPART {d.time}
            </span>
            <span
              className={`whitespace-nowrap shrink-0 font-mono text-xs px-2.5 py-0.5 rounded-full border ${
                d.seats <= 4
                  ? "bg-rose-500/15 border-rose-400/35 text-rose-300"
                  : "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
              }`}
            >
              {d.seats} place{d.seats > 1 ? "s" : ""} dispo
            </span>
            {d.paid && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-400/25 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3 h-3" /> SenePay QR
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 shrink-0">
          {departures.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Voir départ ${idx + 1}`}
              onClick={() => setIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === index ? "w-5 bg-emerald-400" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
