import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Mail, Phone, MapPin, Send, MessageSquare, Smartphone,
  Globe, ExternalLink, Download, ShieldCheck, Building2, HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { sendContactMessage } from "../services/api";
import { SpotlightCard, Reveal } from "../components/fx";

export function Contact() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.hash === "#telecharger") {
      const el = document.getElementById("telecharger");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 150);
    }
  }, [location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.email.trim() || !formData.telephone.trim() || !formData.message.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires (nom, e-mail, téléphone et message).");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendContactMessage(formData);
      toast.success("Message envoyé avec succès ! Notre équipe vous répondra très rapidement.");
      setFormData({ nom: "", email: "", telephone: "", sujet: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Support Général",
      value: "contact@transen.org",
      link: "mailto:contact@transen.org",
      accent: "text-emerald-300",
    },
    {
      icon: Mail,
      title: "Relations Investisseurs",
      value: "fadiloundiaye2004@gmail.com",
      link: "mailto:fadiloundiaye2004@gmail.com",
      accent: "text-amber-300",
    },
    {
      icon: Phone,
      title: "Téléphone & Urgences",
      value: "+221 78 138 64 05",
      link: "tel:+221781386405",
      accent: "text-cyan-300",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp 24/7",
      value: "+221 78 138 64 05",
      link: "https://wa.me/221781386405",
      accent: "text-emerald-300",
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
            <span className="eyebrow mb-5">Assistance 24/7 & Accès Application</span>
            <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white mb-5">
              Application & <span className="text-gradient-aurora">Contact Direct</span>
            </h1>
            <p className="text-lg text-slate-300">
              Utilisez immédiatement l'application Web TranSen, demandez l'APK Android ou échangez avec notre équipe à Dakar et Louga.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MODULE TÉLÉCHARGEMENT & ACCÈS APPLICATION (manquait auparavant!) ── */}
      <section id="telecharger" className="py-16 section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gradient-border rounded-3xl">
            <div className="glass-strong rounded-3xl p-7 sm:p-10 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="eyebrow eyebrow-gold">Application TranSen · Web & Mobile</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  Voyagez dès maintenant sur <span className="text-gradient-gold">app.transen.org</span> ou Android
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  L'application mobile TranSen (Android & iOS) est finalisée à 99 % et en cours de déploiement sur les stores officiels.
                  Vous pouvez dès aujourd'hui réserver vos bus, commander un VTC Allô Dakar ou suivre vos colis Yobanté sur l'application Web progressive (PWA) sans téléchargement.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="https://app.transen.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold text-sm"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Ouvrir app.transen.org</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="https://wa.me/221781386405?text=Bonjour%20TranSen%2C%20je%20souhaite%20recevoir%20le%20lien%20de%20t%C3%A9l%C3%A9chargement%20de%20l%27APK%20Android%20TranSen."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost text-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>Recevoir l'APK Android via WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 grid sm:grid-cols-2 gap-3.5">
                <a
                  href="https://compagnie.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-white/[0.04] border border-cyan-400/25 hover:border-cyan-400/60 transition-all group"
                >
                  <Building2 className="w-6 h-6 text-cyan-300 mb-3" />
                  <div className="font-bold text-white text-sm group-hover:text-cyan-300">Portail Compagnies</div>
                  <div className="text-xs font-mono text-cyan-300/80 mt-1">compagnie.transen.org</div>
                </a>
                <a
                  href="https://investir.transen.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-white/[0.04] border border-amber-400/25 hover:border-amber-400/60 transition-all group"
                >
                  <ShieldCheck className="w-6 h-6 text-amber-300 mb-3" />
                  <div className="font-bold text-white text-sm group-hover:text-amber-300">Portail Investisseurs</div>
                  <div className="text-xs font-mono text-amber-300/80 mt-1">investir.transen.org</div>
                </a>
                <div className="sm:col-span-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span className="text-xs text-slate-300">
                    Astuce : Sur Chrome ou Safari mobile, ouvrez <strong className="text-white">app.transen.org</strong> puis cliquez sur <em>« Ajouter à l'écran d'accueil »</em>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards + Form */}
      <section className="py-20 section-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {contactInfo.map((info, index) => (
              <Reveal key={info.title} delay={index * 0.06}>
                <a
                  href={info.link}
                  target={info.link.startsWith("http") ? "_blank" : undefined}
                  rel={info.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block glass rounded-2xl p-6 hover:border-emerald-400/45 transition-all h-full"
                >
                  <div className="icon-tile mb-4">
                    <info.icon className={`w-6 h-6 ${info.accent}`} />
                  </div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-1">
                    {info.title}
                  </h3>
                  <p className="text-white font-bold text-sm break-all">{info.value}</p>
                </a>
              </Reveal>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Contact Form */}
            <div className="lg:col-span-7">
              <SpotlightCard className="p-7 sm:p-9">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white mb-2">
                  Envoyez-nous un message
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                  Votre message est enregistré en temps réel dans notre centre de support et suivi par notre équipe.
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="nom" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Nom complet *
                    </label>
                    <input
                      id="nom"
                      type="text"
                      required
                      placeholder="Ex: Moussa Diallo"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="field-dark text-sm"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="moussa@exemple.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="field-dark text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="telephone" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Téléphone / WhatsApp *
                      </label>
                      <input
                        id="telephone"
                        type="tel"
                        required
                        placeholder="+221 77 123 45 67"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className="field-dark text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sujet" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Objet de votre demande *
                    </label>
                    <select
                      id="sujet"
                      required
                      value={formData.sujet}
                      onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                      className="field-dark text-sm"
                    >
                      <option value="">Sélectionner un sujet</option>
                      <option value="PASSAGER_SUPPORT">Assistance Passager / Billet</option>
                      <option value="PARTENARIAT_COMPAGNIE">Partenariat Compagnie de Transport</option>
                      <option value="CHAUFFEUR">Candidature Chauffeur Allô Dakar</option>
                      <option value="INVESTISSEUR">Relations Investisseurs</option>
                      <option value="AUTRE">Autre demande</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      placeholder="Décrivez votre demande..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="field-dark text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold w-full text-sm sm:text-base cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Envoi en cours..." : "Envoyer le message"}</span>
                  </button>
                </form>
              </SpotlightCard>
            </div>

            {/* Right Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass rounded-3xl p-7 border border-emerald-400/20">
                <div className="icon-tile mb-4">
                  <MapPin className="w-6 h-6 text-emerald-300" />
                </div>
                <h3 className="text-xl font-bold font-display text-white mb-2">Siège & Présence Nationale</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Direction opérationnelle à <strong>Dakar</strong> et siège administratif à <strong>Louga-Santhiaba-Sud</strong>,
                  avec un réseau commercial déployé sur les <strong>14 régions du Sénégal</strong>.
                </p>
                <div className="space-y-2.5 text-sm border-t border-white/10 pt-4 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lundi – Vendredi</span>
                    <span className="text-white">08h00 – 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Samedi</span>
                    <span className="text-white">09h00 – 14h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assistance WhatsApp</span>
                    <span className="text-emerald-300 font-bold">24h/24 · 7j/7</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Link to="/chauffeurs" className="glass rounded-2xl p-5 hover:border-emerald-400/45 transition-all flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Devenir Chauffeur Partenaire</div>
                    <div className="text-xs text-slate-400 mt-0.5">2 % commission ou abonnement 0 %</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-300 shrink-0" />
                </Link>
                <Link to="/faq" className="glass rounded-2xl p-5 hover:border-amber-400/45 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-300 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-sm">Consulter la FAQ</div>
                      <div className="text-xs text-slate-400 mt-0.5">Réservations, SenePay, annulations</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-amber-300 shrink-0" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
