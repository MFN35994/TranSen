import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function Politique() {
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
              <ShieldAlert className="w-8 h-8 text-[var(--brand-gold)]" />
            </div>
            <h1 className="text-4xl md:text-5xl text-white mb-6">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-gray-200">
              Dernière mise à jour : Juin 2026
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
                1. Collecte des données
              </h2>
              <p className="leading-relaxed mb-4">
                Nous collectons les informations nécessaires au fonctionnement du service de transport :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Numéro de téléphone (pour l'authentification OTP via Orange SMS).</li>
                <li>Nom et Prénom.</li>
                <li>Données de géolocalisation en temps réel (pour suivre la course).</li>
                <li>Historique des trajets et transactions.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                2. Utilisation des données
              </h2>
              <p className="leading-relaxed mb-4">
                Vos données sont utilisées exclusivement pour :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vous mettre en relation avec le chauffeur ou le client le plus proche.</li>
                <li>Assurer votre sécurité grâce au suivi GPS (accessible aux compagnies partenaires pour leurs flottes).</li>
                <li>Gérer les paiements et remboursements.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                3. Partage des données
              </h2>
              <p className="leading-relaxed">
                TranSen ne vend jamais vos données personnelles. Elles sont uniquement partagées dans le cadre du service (ex: le chauffeur voit votre prénom pour vous identifier).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                4. Vos droits
              </h2>
              <p className="leading-relaxed">
                Conformément à la réglementation sénégalaise en vigueur (CDP), vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, écrivez à notre support technique.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                5. Contact
              </h2>
              <p className="leading-relaxed">
                Pour toute question sur la gestion de vos données, veuillez nous contacter à l'adresse officielle :{" "}
                <a href="mailto:contact@transen.org" className="font-bold underline" style={{ color: "var(--brand-green)" }}>
                  contact@transen.org
                </a>.
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
