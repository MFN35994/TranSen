import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[var(--brand-green)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="TranSen Logo"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <div className="text-xl font-bold">TranSen</div>
            </div>
            <p className="text-gray-200 mb-4">
              La plateforme de mobilité urbaine et interurbaine la plus fiable au Sénégal
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/compagnies" className="hover:text-amber-300 transition-colors font-semibold">
                  Espace Compagnies 🏢
                </Link>
              </li>
              <li>
                <Link to="/chauffeurs" className="hover:text-white transition-colors">
                  Devenir Chauffeur
                </Link>
              </li>
            </ul>
          </div>

          {/* Plateformes URL (Requested URLs) */}
          <div>
            <h4 className="mb-4 text-amber-300 font-bold">Plateformes URL</h4>
            <ul className="space-y-3 text-gray-300 text-xs">
              <li>
                <a href="https://app.transen.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex flex-col">
                  <span className="font-bold text-white">Application Web</span>
                  <span className="text-amber-300 text-[11px] font-mono">app.transen.org</span>
                </a>
              </li>
              <li>
                <a href="https://compagnie.transen.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex flex-col">
                  <span className="font-bold text-white">Portail Compagnies</span>
                  <span className="text-amber-300 text-[11px] font-mono">compagnie.transen.org</span>
                </a>
              </li>
              <li>
                <a href="https://investir.transen.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex flex-col">
                  <span className="font-bold text-white">Site Investisseurs</span>
                  <span className="text-amber-300 text-[11px] font-mono">investir.transen.org</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4">Entreprise</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/investir" className="hover:text-amber-300 text-amber-400 font-semibold transition-colors flex items-center gap-1">
                  🌐 Investir chez nous
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  À Propos
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white transition-colors">
                  Notre Équipe
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a href="mailto:contact@transen.org" className="hover:text-white transition-colors text-xs overflow-hidden text-ellipsis whitespace-nowrap block max-w-full">
                  contact@transen.org
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <a href="tel:+221781386405" className="hover:text-white transition-colors text-xs">
                  +221 78 138 64 05
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-xs">Dakar, Sénégal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-200">
            © 2026 TranSen. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-gray-400">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link to="/conditions" className="hover:text-white transition-colors">
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}