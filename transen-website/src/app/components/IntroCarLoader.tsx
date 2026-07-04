import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";

interface IntroCarLoaderProps {
  onComplete: () => void;
}

export function IntroCarLoader({ onComplete }: IntroCarLoaderProps) {
  const [progress, setProgress] = useState(0);

  const loadingStatuses = [
    "Démarrage de l'expérience TranSen...",
    "Initialisation des trajets Urbains & Interurbains...",
    "Application du taux unique de commission de 1%...",
    "Configuration des sièges interactifs (60 places max)...",
    "Prêt pour le départ !",
  ];

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Progress bar simulation over exactly 5000ms
  useEffect(() => {
    const duration = 5000; // Exact duration requested: 5 seconds
    const intervalTime = 30; // Smooth tick
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        // Clean handoff to onComplete
        setTimeout(() => {
          onCompleteRef.current();
        }, 450);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  // Derive status index directly from the progress percentage
  const statusIndex = Math.min(
    Math.floor((progress / 100) * loadingStatuses.length),
    loadingStatuses.length - 1
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden select-none"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,164,77,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Moving road stars/dust speed effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: "100%", y: `${10 + Math.random() * 80}%` }}
            animate={{ x: "-20%" }}
            transition={{
              duration: 1 + Math.random() * 2,
              repeat: progress < 100 ? Infinity : 0,
              ease: "linear",
              delay: Math.random() * 2,
            }}
            className="absolute h-[1px] w-[50px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
          />
        ))}
      </div>

      <div className="relative w-full max-w-xl px-6 flex flex-col items-center">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Sénégal 2026
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white">
            Tran<span className="text-emerald-500">Sen</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-2 font-mono">L'URBAIN & L'INTERURBAIN À PORTÉE DE MAIN</p>
        </motion.div>

        {/* ── Vector Rolling Car Animation ──────────────────────────────── */}
        <div className="relative w-full h-44 flex items-center justify-center mb-8">
          {/* Main Car Assembly Container */}
          <motion.div
            initial={{ x: -150, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 60, damping: 10, delay: 0.2 }}
            className="relative"
          >
            {/* Soft Shadow beneath */}
            <motion.div
              animate={{
                scaleX: progress < 100 ? [1, 1.05, 0.95, 1] : 1,
                opacity: progress < 100 ? [0.6, 0.8, 0.6, 0.6] : 0.6
              }}
              transition={{ duration: 1.5, repeat: progress < 100 ? Infinity : 0, ease: "easeInOut" }}
              className="absolute -bottom-1 left-2 right-2 h-2.5 bg-black/60 rounded-full blur-[4px]"
            />

            {/* Exhaust gas particles */}
            <div className="absolute left-[-25px] top-[35px] flex flex-col gap-1">
              {progress < 100 && [...Array(4)].map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.8, scale: 0.3, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.8, x: -60, y: -10 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: idx * 0.2,
                    ease: "easeOut"
                  }}
                  className="w-3 h-3 rounded-full bg-zinc-600/30 blur-[2px]"
                />
              ))}
            </div>

            {/* SVG Car Art */}
            {/* Premium dark emerald sports SUV silhouette suited for Sénégalese terrain */}
            <svg
              width="230"
              height="85"
              viewBox="0 0 230 85"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
            >
              {/* Headlight Flare Path */}
              <motion.polygon
                points="198,34 230,10 230,70 198,44"
                fill="url(#headlight-glow)"
                animate={{ opacity: progress < 100 ? [0.4, 0.7, 0.4] : 0.3 }}
                transition={{ duration: 1, repeat: progress < 100 ? Infinity : 0, ease: "easeInOut" }}
              />

              {/* Car Body */}
              <path
                d="M12 45C12 45 25 43 32 30C39 17 55 12 85 11C115 10 148 10 162 18C176 26 182 32 195 33C208 34 216 42 216 48C216 54 212 55 208 55C204 55 198 55 198 55C198 55 195 53 192 53C185 53 179 57 179 61C179 64 165 64 165 64C165 64 159 53 150 53C141 53 133 60 133 62C133 63 94 63 91 63C91 63 86 53 76 53C66 53 58 60 58 62C58 63 24 63 18 61C12 59 12 45 12 45Z"
                fill="url(#car-gradient)"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Cabin Windows */}
              <path
                d="M60 22C60 22 84 15 110 15C136 15 152 20 156 26C160 32 158 35 158 35H62C62 35 58 32 60 22Z"
                fill="#18181b"
                stroke="#34d399"
                strokeWidth="1.5"
              />
              {/* Window Pillar divider */}
              <line x1="110" y1="15" x2="110" y2="35" stroke="#10b981" strokeWidth="2" />

              {/* Golden Highlight Trim */}
              <path
                d="M30 45H180"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="opacity-90"
              />

              {/* Backlight red glow */}
              <rect x="8" y="38" width="5" height="10" rx="2" fill="#ef4444" />

              {/* Wheel Arches */}
              <path d="M58 62C58 54 66 50 76 50C86 50 91 54 91 62" stroke="#10b981" strokeWidth="2" />
              <path d="M133 62C133 54 141 50 150 50C159 50 165 54 165 62" stroke="#10b981" strokeWidth="2" />

              {/* Gradients */}
              <defs>
                <linearGradient id="car-gradient" x1="12" y1="36" x2="216" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#052e16" />
                  <stop offset="40%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <radialGradient id="headlight-glow" cx="198" cy="39" r="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>

            {/* Rear Wheel (Rotating Gold Rim) */}
            <motion.div
              className="absolute left-[59.5px] top-[48.5px] w-11 h-11"
              animate={{ rotate: progress < 100 ? 360 : 0 }}
              transition={{ duration: 0.6, repeat: progress < 100 ? Infinity : 0, ease: "linear" }}
            >
              <WheelSVG />
            </motion.div>

            {/* Front Wheel (Rotating Gold Rim) */}
            <motion.div
              className="absolute left-[134.5px] top-[48.5px] w-11 h-11"
              animate={{ rotate: progress < 100 ? 360 : 0 }}
              transition={{ duration: 0.6, repeat: progress < 100 ? Infinity : 0, ease: "linear" }}
            >
              <WheelSVG />
            </motion.div>
          </motion.div>

          {/* Under road line */}
          <div className="absolute bottom-1 w-full max-w-sm h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ x: progress < 100 ? [-100, 100] : 0 }}
              transition={{ duration: 0.5, repeat: progress < 100 ? Infinity : 0, ease: "linear" }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
            />
          </div>
        </div>

        {/* Status indicator info */}
        <div className="w-full text-center mb-6 h-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-zinc-200"
            >
              {loadingStatuses[statusIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Dynamic bottom badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-1.5 mt-2"
        >
          <div className="flex gap-4 text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1 text-emerald-400">
              <CreditCard className="w-3.5 h-3.5" />
              Commission 1%
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sécurisé
            </span>
          </div>

          <button
            onClick={onComplete}
            className="mt-6 text-xs text-zinc-500 hover:text-amber-400 font-semibold transition-all hover:scale-105 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Passer la cinématique <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* Wheel component Helper */
function WheelSVG() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Heavy Tire */}
      <circle cx="22" cy="22" r="21" fill="#18181b" stroke="#34d399" strokeWidth="2" />
      <circle cx="22" cy="22" r="16" fill="#111827" />
      
      {/* Golden Luxury Rims */}
      <circle cx="22" cy="22" r="10" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="4" fill="#fbbf24" />

      {/* Spokes */}
      <line x1="22" y1="2" x2="22" y2="42" stroke="#fbbf24" strokeWidth="1.5" />
      <line x1="2" y1="22" x2="42" y2="22" stroke="#fbbf24" strokeWidth="1.5" />
      <line x1="8" y1="8" x2="36" y2="36" stroke="#fbbf24" strokeWidth="1" />
      <line x1="8" y1="36" x2="36" y2="8" stroke="#fbbf24" strokeWidth="1" />
    </svg>
  );
}
