import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface ThemeMood {
  name: string;
  label: string;
  tagline: string;
  primary: string;      // Premium hex for active brand color
  dark: string;         // Premium dark state
  gold: string;         // Highlight accent
  bgGradient: string;   // Background gradient shade
  orb1Color: string;    // Soft translucent hex for floating orb 1
  orb2Color: string;    // Soft translucent hex for floating orb 2
  textColor: string;    // Content adaptive styling indicator
  badgeStyle: string;   // CSS classes for color badge representation
}

const MOODS: ThemeMood[] = [
  {
    name: "vert",
    label: "Sénégal Émeraude",
    tagline: "Fraîcheur & Croissance Urbaine",
    primary: "#14A44D",
    dark: "#0a4b22",
    gold: "#FFD700",
    bgGradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    orb1Color: "rgba(16, 185, 129, 0.16)",
    orb2Color: "rgba(20, 164, 77, 0.12)",
    textColor: "text-emerald-500",
    badgeStyle: "bg-emerald-500 border-emerald-400"
  },
  {
    name: "jaune",
    label: "Or de la Teranga",
    tagline: "Énergie & Chaleur des Savanes",
    primary: "#dfa705",
    dark: "#7c5c00",
    gold: "#ffffff",
    bgGradient: "from-amber-500/15 via-yellow-500/5 to-transparent",
    orb1Color: "rgba(245, 158, 11, 0.16)",
    orb2Color: "rgba(251, 191, 36, 0.12)",
    textColor: "text-amber-500",
    badgeStyle: "bg-amber-500 border-amber-400"
  },
  {
    name: "rouge",
    label: "Baobab Cramoisi",
    tagline: "Dynamisme & Progrès National",
    primary: "#ef4444",
    dark: "#8e0a0a",
    gold: "#FFD700",
    bgGradient: "from-red-500/15 via-rose-500/5 to-transparent",
    orb1Color: "rgba(239, 68, 68, 0.16)",
    orb2Color: "rgba(244, 63, 94, 0.12)",
    textColor: "text-rose-500",
    badgeStyle: "bg-rose-500 border-rose-400"
  },
  {
    name: "bleu",
    label: "Océan Atlantique",
    tagline: "Sérénité & Connectivité Globale",
    primary: "#2563eb",
    dark: "#0f2e6e",
    gold: "#fbbf24",
    bgGradient: "from-blue-500/15 via-indigo-500/5 to-transparent",
    orb1Color: "rgba(37, 99, 235, 0.16)",
    orb2Color: "rgba(59, 130, 246, 0.12)",
    textColor: "text-blue-500",
    badgeStyle: "bg-blue-600 border-blue-400"
  },
  {
    name: "violet",
    label: "Crépuscule Sahélien",
    tagline: "Rêve, Prestige & Modernité",
    primary: "#7c3aed",
    dark: "#3b1178",
    gold: "#ffd700",
    bgGradient: "from-violet-500/15 via-purple-500/5 to-transparent",
    orb1Color: "rgba(124, 58, 237, 0.16)",
    orb2Color: "rgba(139, 92, 246, 0.12)",
    textColor: "text-violet-500",
    badgeStyle: "bg-violet-600 border-violet-400"
  }
];

export function PremiumAmbientEngine() {
  const [activeIdx, setActiveIdx] = useState(0);

  const activeMood = MOODS[activeIdx];

  // Dynamic style variable injector
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-green", activeMood.primary);
    root.style.setProperty("--brand-green-dark", activeMood.dark);
    root.style.setProperty("--brand-gold", activeMood.gold);
    root.style.setProperty("--premium-glow-color", activeMood.orb1Color);
  }, [activeIdx]);

  // Periodic color shift timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % MOODS.length);
    }, 7500); // Shift every 7.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ── Dynamic Ambient Blur Background (Floating Orbs) ─────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-transparent" />

        {/* Dynamic Glowing Orb 1 */}
        <motion.div
          animate={{
            x: ["-20%", "20%", "-10%", "-20%"],
            y: ["-10%", "30%", "10%", "-10%"],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ backgroundColor: activeMood.orb1Color }}
          className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 dark:opacity-20 transition-colors duration-[3000ms]"
        />

        {/* Dynamic Glowing Orb 2 */}
        <motion.div
          animate={{
            x: ["20%", "-20%", "10%", "20%"],
            y: ["20%", "-10%", "30%", "20%"],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ backgroundColor: activeMood.orb2Color }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[110px] opacity-40 dark:opacity-20 transition-colors duration-[3000ms]"
        />
        
        {/* Ambient Top Light Beam */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[300px] rounded-b-full blur-[120px] opacity-25 transition-colors duration-[3000ms]"
          style={{ backgroundColor: activeMood.orb1Color }}
        />
      </div>
    </>
  );
}
