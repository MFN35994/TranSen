import { useRef, type ReactNode, type MouseEvent, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * TranSen Aurora — primitives visuelles partagées.
 * À utiliser dans toutes les pages pour garder une identité cohérente.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** Apparition douce au scroll (fade + translate + léger flou). */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Carte vitrée avec halo lumineux qui suit le curseur. */
export function SpotlightCard({
  children,
  className = "",
  style,
  tilt = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tilt?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    if (tilt && !reduce) {
      const rx = ((y / r.height) - 0.5) * -6;
      const ry = ((x / r.width) - 0.5) * 6;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    }
  };
  const onLeave = () => {
    if (tilt && ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`spotlight-card ${className}`} style={style}>
      {children}
    </div>
  );
}

/** En-tête de section standardisé : eyebrow + titre + sous-titre. */
export function SectionHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = "center",
  gold = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  highlight?: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  gold?: boolean;
}) {
  const center = align === "center";
  return (
    <Reveal className={`${center ? "text-center mx-auto" : ""} max-w-3xl mb-14`}>
      {eyebrow && <span className={`eyebrow ${gold ? "eyebrow-gold" : ""} mb-5`}>{eyebrow}</span>}
      <h2 className="display-lg text-white mt-5">
        {title} {highlight && <span className={gold ? "text-gradient-gold" : "text-gradient-aurora"}>{highlight}</span>}
      </h2>
      {subtitle && <p className={`mt-5 text-base sm:text-lg text-slate-400 leading-relaxed ${center ? "mx-auto" : ""} max-w-2xl`}>{subtitle}</p>}
    </Reveal>
  );
}

/** Hero de page interne, cohérent sur tout le site. */
export function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
  gold = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  highlight?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  gold?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden aurora-bg noise pt-28 pb-24 sm:pt-32 sm:pb-28">
      <div className="grid-fade absolute inset-0 pointer-events-none" aria-hidden="true" />
      <motion.div
        aria-hidden="true"
        className="orb w-[520px] h-[520px] -top-40 -right-32"
        style={{ background: gold ? "rgba(245,184,61,0.22)" : "rgba(34,211,238,0.18)" }}
        animate={reduce ? undefined : { x: [0, -30, 10, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="orb w-[460px] h-[460px] -bottom-48 -left-24"
        style={{ background: "rgba(16,185,129,0.22)" }}
        animate={reduce ? undefined : { x: [0, 30, -10, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {eyebrow && <span className={`eyebrow ${gold ? "eyebrow-gold" : ""}`}>{eyebrow}</span>}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
          className="display-xl text-white mt-6 max-w-5xl mx-auto"
        >
          {title} {highlight && <span className={gold ? "text-gradient-gold" : "text-gradient-aurora"}>{highlight}</span>}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mt-6 text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.32, ease: EASE }}
            className="mt-10"
          >
            {children}
          </motion.div>
        )}
      </div>
      <div className="absolute bottom-0 inset-x-0 glow-line opacity-60" aria-hidden="true" />
    </section>
  );
}
