import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Radio } from "lucide-react";
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

  // Tenter de charger les départs réels du jour depuis Spring Boot (/api/trips/search)
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
    <div style={{ backgroundColor: "#0a2e18" }} className="py-3 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          <span className="text-green-400 text-xs whitespace-nowrap tracking-wide font-semibold">
            DÉPARTS EN DIRECT
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${d.company}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 text-sm text-gray-400 flex-1 min-w-0"
          >
            <span style={{ color: "var(--brand-gold)" }} className="whitespace-nowrap shrink-0 font-semibold">
              {d.company}
            </span>
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
                <span className="text-blue-400 whitespace-nowrap shrink-0">SenePay</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
