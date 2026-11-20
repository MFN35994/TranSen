import { motion } from "motion/react";
import { Mail, Code2, ShieldCheck, Sparkles, Award, Briefcase } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SpotlightCard, Reveal } from "../components/fx";

export function Team() {
  const teamMembers = [
    {
      name: "Mouhamadou Fadilou Ndiaye",
      role: "Fondateur & CEO",
      badge: "Économie Quantitative · Tech",
      email: "fadiloundiaye2004@gmail.com",
      image: "https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Titulaire d'une Licence en Économie appliquée et d'un Master 2 en Analyse Économique Quantitative à l'UGB Saint-Louis, certifié ITTE Group Consulting (comptabilité & Sage Saari). Analyste Financier chez Kopar Express, Responsable commercial zone Nord et consultant financier chez PITEXTILE. Concepteur et développeur de l'écosystème web et mobile TranSen.",
    },
    {
      name: "Fatoumata Kanouté",
      role: "Co-fondatrice & CTO",
      badge: "Architecture Mobile & Web",
      email: "contact@transen.org",
      image: "https://images.unsplash.com/photo-1668752741330-8adc5cef7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwd29tYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Experte en développement d'applications mobiles et web, Fatoumata supervise l'architecture technique, la fiabilité des flux temps réel et l'expérience mobile TranSen.",
    },
    {
      name: "Mbaye Seck Mbaye",
      role: "Co-fondateur & Lead Backend",
      badge: "Spring Boot · PostgreSQL",
      email: "contact@transen.org",
      image: "https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Spécialiste des systèmes backend haute disponibilité et des bases de données, Seck assure la robustesse, la sécurité des transactions SenePay et la scalabilité de nos services.",
    },
    {
      name: "Mbaye Babacar Ndiaye",
      role: "Co-fondateur & Frontend Engineer",
      badge: "Design System Aurora",
      email: "contact@transen.org",
      image: "https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Designer et développeur frontend, Babacar conçoit des interfaces modernes, rapides et accessibles sur mobile comme sur ordinateur pour les voyageurs et compagnies.",
    },
  ];

  return (
    <div className="bg-[#03100b] text-slate-100">
      {/* Hero Aurora */}
      <section className="py-20 aurora-bg noise relative overflow-hidden border-b border-emerald-500/20">
        <div className="grid-fade absolute inset-0 opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="eyebrow mb-5">Leadership & Ingénierie Sénégal</span>
            <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white mb-5">
              L'équipe qui bâtit <span className="text-gradient-aurora">TranSen</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Une équipe ancrée sur le terrain au Sénégal, alliant économie quantitative, finance, commerce régional et ingénierie logicielle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <Reveal key={member.name} delay={index * 0.08}>
                <SpotlightCard className="overflow-hidden h-full flex flex-col">
                  <div className="h-72 overflow-hidden relative">
                    <ImageWithFallback
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071a12] via-transparent to-transparent" />
                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#03100b]/85 text-amber-300 border border-amber-400/35 backdrop-blur-md">
                      {member.badge}
                    </span>
                  </div>
                  <div className="p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-extrabold font-display text-white mb-2">
                        {member.name}
                      </h3>
                      <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                        <Briefcase className="w-3.5 h-3.5" />
                        {member.role}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        {member.bio}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-300 hover:text-amber-200 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </a>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gradient-border rounded-3xl">
            <div className="glass-strong rounded-3xl p-8 md:p-12 text-center">
              <span className="eyebrow eyebrow-gold mb-4">Recrutement Phase 1 · 15 Postes Nationaux</span>
              <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white mb-4">
                Rejoignez l'aventure TranSen
              </h2>
              <p className="text-base sm:text-lg mb-8 text-slate-300 max-w-2xl mx-auto">
                Développeurs Full-Stack & Flutter, commerciaux régionaux (6 zones Sénégal), opérations et support client : construisons ensemble le transport de demain.
              </p>
              <a
                href="mailto:contact@transen.org?subject=Candidature%20TranSen"
                className="btn-gold text-sm sm:text-base"
              >
                <Sparkles className="w-4 h-4" />
                <span>Postuler maintenant (contact@transen.org)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Culture & Values */}
      <section className="py-20 section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="eyebrow mb-3">ADN TranSen</span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white">
              Notre Culture d'Exécution
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Code2, title: "Ingénierie Locale", desc: "Des produits conçus au Sénégal, adaptés aux réalités terrain (Mobile Money, faible bande passante, 14 régions)." },
              { Icon: ShieldCheck, title: "Intégrité & Transparence", desc: "Une commission claire de 2 %, des comptes transparents et une protection stricte des voyageurs et transporteurs." },
              { Icon: Award, title: "Excellence Opérationnelle", desc: "Fiabilité des horaires, suivi GPS temps réel et support humain réactif 24h/24 et 7j/7." },
            ].map((value, index) => (
              <Reveal key={value.title} delay={index * 0.08}>
                <SpotlightCard className="p-7 text-center h-full">
                  <div className="icon-tile mx-auto mb-5">
                    <value.Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-white mb-3">{value.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{value.desc}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
