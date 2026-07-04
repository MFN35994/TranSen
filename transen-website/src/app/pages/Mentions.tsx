import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

export function Mentions() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20" style={{ backgroundColor: "var(--brand-green)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Scale className="w-8 h-8 text-[var(--brand-gold)]" />
            </div>
            <h1 className="text-4xl md:text-5xl text-white mb-6">
              Mentions Légales
            </h1>
            <p className="text-xl text-gray-200">
              Informations sur l'éditeur et l'hébergeur
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="prose prose-green max-w-none text-gray-600 space-y-12"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                1. Éditeur de l'application et du site web
              </h2>
              <p className="leading-relaxed">
                Le site web <strong>transen.org</strong> et l'application mobile <strong>TranSen</strong> sont édités par l'entreprise TranSen.
              </p>
              <p className="leading-relaxed mt-2">
                Adresse de l'entreprise : Louga-Santhiaba-Sud, Sénégal.
              </p>
              <p className="leading-relaxed mt-2">
                Support et Contact :{" "}
                <a href="mailto:contact@transen.org" className="font-bold underline" style={{ color: "var(--brand-green)" }}>
                  contact@transen.org
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                2. Hébergement
              </h2>
              <p className="leading-relaxed">
                Ce site web est hébergé par Ligne Web Services (LWS).
              </p>
              <p className="leading-relaxed mt-2">
                L'infrastructure backend et les bases de données sécurisées sont hébergées par Render Inc.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                3. Propriété Intellectuelle
              </h2>
              <p className="leading-relaxed">
                L'ensemble de ce site et de l'application mobile (structure, textes, logos, interfaces) constitue une œuvre protégée par le droit d'auteur. Toute reproduction totale ou partielle sans l'accord express de TranSen est interdite.
              </p>
            </div>

            <div className="pt-8 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white transition-all hover:shadow-xl hover:scale-105"
                style={{ backgroundColor: "var(--brand-green)" }}
              >
                Retourner à l'accueil
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
