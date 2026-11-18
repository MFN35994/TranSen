import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

interface AuroraMood {
  name: string;
  orb1Color: string;
  orb2Color: string;
}

// Aurores futuristes douces (modulent uniquement l'atmosphère, sans jamais altérer la lisibilité des boutons ou du footer)
const AURORA_MOODS: AuroraMood[] = [
  {
    name: "cyber-emerald",
    orb1Color: "rgba(16, 185, 129, 0.16)",
    orb2Color: "rgba(6, 182, 212, 0.14)",
  },
  {
    name: "teranga-gold",
    orb1Color: "rgba(245, 158, 11, 0.14)",
    orb2Color: "rgba(16, 185, 129, 0.14)",
  },
  {
    name: "atlantic-cyan",
    orb1Color: "rgba(6, 182, 212, 0.16)",
    orb2Color: "rgba(59, 130, 246, 0.13)",
  },
  {
    name: "sahel-nebula",
    orb1Color: "rgba(139, 92, 246, 0.14)",
    orb2Color: "rgba(16, 185, 129, 0.14)",
  },
];

export function PremiumAmbientEngine() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const activeMood = AURORA_MOODS[activeIdx];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--ambient-glow-1", activeMood.orb1Color);
    root.style.setProperty("--ambient-glow-2", activeMood.orb2Color);
  }, [activeMood]);

  useEffect(() => {
    const onVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = setInterval(() => {
      if (!document.hidden) {
        setActiveIdx((prev) => (prev + 1) % AURORA_MOODS.length);
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-transparent" />

      <motion.div
        animate={
          prefersReducedMotion || !isVisible
            ? undefined
            : {
                x: ["-16%", "16%", "-8%", "-16%"],
                y: ["-8%", "22%", "8%", "-8%"],
                scale: [1, 1.1, 0.94, 1],
              }
        }
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ backgroundColor: activeMood.orb1Color }}
        className="ambient-transition absolute top-1/4 left-1/4 w-[420px] h-[420px] rounded-full blur-[95px] opacity-35 dark:opacity-20 will-change-transform"
      />

      <motion.div
        animate={
          prefersReducedMotion || !isVisible
            ? undefined
            : {
                x: ["16%", "-16%", "8%", "16%"],
                y: ["16%", "-8%", "22%", "16%"],
                scale: [1, 0.94, 1.08, 1],
              }
        }
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ backgroundColor: activeMood.orb2Color }}
        className="ambient-transition absolute bottom-1/4 right-1/4 w-[460px] h-[460px] rounded-full blur-[100px] opacity-35 dark:opacity-20 will-change-transform"
      />

      <div
        className="ambient-transition absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[260px] rounded-b-full blur-[100px] opacity-25"
        style={{ backgroundColor: activeMood.orb1Color }}
      />
    </div>
  );
}
