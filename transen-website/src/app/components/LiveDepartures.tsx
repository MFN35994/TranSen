import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Radio } from "lucide-react";

const DEPARTURES = [
  { from: "Dakar", to: "Saint-Louis", time: "08:00", company: "MACHALLA Transport", seats: 4, paid: true },
  { from: "Thiès", to: "Touba", time: "09:30", company: "TranSen Express", seats: 2, paid: true },
  { from: "Kaolack", to: "Ziguinchor", time: "10:00", company: "Sénégal Voyages", seats: 7, paid: false },
  { from: "Dakar", to: "Tambacounda", time: "11:00", company: "MACHALLA Transport", seats: 1, paid: true },
  { from: "Saint-Louis", to: "Louga", time: "08:30", company: "TranSen Express", seats: 5, paid: false },
  { from: "Dakar", to: "Kaolack", time: "07:00", company: "Dakar Bus VIP", seats: 3, paid: true },
  { from: "Ziguinchor", to: "Dakar", time: "06:00", company: "Sénégal Voyages", seats: 8, paid: false },
  { from: "Louga", to: "Dakar", time: "07:30", company: "MACHALLA Transport", seats: 6, paid: true },
  { from: "Dakar", to: "Kolda", time: "05:00", company: "TranSen Express", seats: 2, paid: true },
];

export function LiveDepartures() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % DEPARTURES.length), 3200);
    return () => clearInterval(timer);
  }, []);

  const d = DEPARTURES[index];

  return (
    <div style={{ backgroundColor: "#0a2e18" }} className="py-3 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          <span className="text-green-400 text-xs whitespace-nowrap tracking-wide">DÉPARTS EN DIRECT</span>
        </div>
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 text-sm text-gray-400 flex-1 min-w-0"
          >
            <span style={{ color: "var(--brand-gold)" }} className="whitespace-nowrap shrink-0">{d.company}</span>
            <span className="text-gray-700 shrink-0">·</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <span className="text-white">{d.from}</span>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <span className="text-white">{d.to}</span>
            </span>
            <span className="text-gray-700 shrink-0">·</span>
            <span className="whitespace-nowrap shrink-0 text-gray-400">Départ {d.time}</span>
            <span className="text-gray-700 shrink-0">·</span>
            <span className={`whitespace-nowrap shrink-0 ${d.seats <= 2 ? "text-red-400" : "text-green-400"}`}>
              {d.seats} place{d.seats > 1 ? "s" : ""} dispo
            </span>
            {d.paid && (
              <>
                <span className="text-gray-700 shrink-0">·</span>
                <span className="text-blue-400 whitespace-nowrap shrink-0">Paiement SenePay</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
