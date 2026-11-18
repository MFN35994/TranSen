import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#030B08] text-slate-100 overflow-hidden border-t border-emerald-500/20">
      {/* Futuristic luminous top border beam */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 opacity-85" />
      <div className="pointer-events-none absolute -top-24 left-1/4 w-80 h-48 rounded-full bg-emerald-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-80 h-48 rounded-full bg-cyan-500/10 blur-[80px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-0.5 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400">
                <img
                  src="/logo.png"
                  alt="TranSen Logo"
                  loading="lazy"
                  decoding="async"
                  className="w-9 h-9 rounded-[10px] object-contain bg-white"
                />
              </div>
              <div className="text-xl font-extrabold tracking-tight text-white">
                Tran<span className="text-emerald-400">Sen</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              L'infrastructure numérique de mobilité urbaine, interurbaine et logistique de référence au Sénégal.
            </p>
            <div className="flex gap-3">
              <a href="https://transen.org" aria-label="Facebook TranSen" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-400/40 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://transen.org" aria-label="Twitter TranSen" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://transen.org" aria-label="Instagram TranSen" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-400/40 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://transen.org" aria-label="LinkedIn TranSen" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-400/40 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Liens Rapides</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link></li>
              <li><Link to="/services" className="hover:text-emerald-400 transition-colors">Services</Link></li>
              <li><Link to="/tarifs" className="hover:text-emerald-400 transition-colors">Tarifs (2%)</Link></li>
              <li><Link to="/compagnies" className="hover:text-amber-300 transition-colors font-semibold text-emerald-300">Espace Compagnies</Link></li>
              <li><Link to="/chauffeurs" className="hover:text-emerald-400 transition-colors">Devenir Chauffeur</Link></li>
            </ul>
          </div>

          {/* Plateformes URL */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-400">Écosystème Web</h4>
            <ul className="space-y-3 text-xs">
              <li>
                <a href="https://app.transen.org" target="_blank" rel="noopener noreferrer" className="group flex flex-col p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-400/40 transition-all">
                  <span className="font-bold text-white group-hover:text-emerald-300">Application Web</span>
                  <span className="text-emerald-400/90 text-[11px] font-mono">app.transen.org</span>
                </a>
              </li>
              <li>
                <a href="https://compagnie.transen.org" target="_blank" rel="noopener noreferrer" className="group flex flex-col p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/40 transition-all">
                  <span className="font-bold text-white group-hover:text-cyan-300">Portail Compagnies</span>
                  <span className="text-cyan-400/90 text-[11px] font-mono">compagnie.transen.org</span>
                </a>
              </li>
              <li>
                <a href="https://investir.transen.org" target="_blank" rel="noopener noreferrer" className="group flex flex-col p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-400/40 transition-all">
                  <span className="font-bold text-white group-hover:text-amber-300">Site Investisseurs</span>
                  <span className="text-amber-400/90 text-[11px] font-mono">investir.transen.org</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Entreprise</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/investir" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Investir chez nous</Link></li>
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">À Propos</Link></li>
              <li><Link to="/team" className="hover:text-emerald-400 transition-colors">Notre Équipe</Link></li>
              <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact</h4>
            <ul className="space-y-3 text-slate-400 text-xs">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <a href="mailto:contact@transen.org" className="hover:text-white transition-colors truncate">contact@transen.org</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-0.5 text-cyan-400 flex-shrink-0" />
                <a href="tel:+221781386405" className="hover:text-white transition-colors">+221 78 138 64 05</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>Dakar, Sénégal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p className="text-slate-300">© 2026 TranSen S.A.S. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/mentions-legales" className="hover:text-emerald-400 transition-colors">Mentions Légales</Link>
            <Link to="/confidentialite" className="hover:text-emerald-400 transition-colors">Confidentialité</Link>
            <Link to="/conditions" className="hover:text-emerald-400 transition-colors">Conditions d'utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}