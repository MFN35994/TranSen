import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function CGU() {
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
              <Shield className="w-8 h-8 text-[var(--brand-gold)]" />
            </div>
            <h1 className="text-4xl md:text-5xl text-white mb-6">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-xl text-gray-200">
              Dernière mise à jour : Juin 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* CGU Content */}
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
                1. Présentation du service
              </h2>
              <p className="leading-relaxed">
                TranSen est une infrastructure numérique de mise en relation entre des clients, des chauffeurs indépendants (Allo Dakar), et des compagnies de transport sur l'étendue du territoire national sénégalais (14 régions).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                2. Accès à la plateforme
              </h2>
              <p className="leading-relaxed">
                L'utilisation de la plateforme nécessite la création d'un compte validé par un numéro de téléphone sénégalais (+221). L'utilisateur s'engage à fournir des informations exactes et à les mettre à jour.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                3. Rôle de TranSen
              </h2>
              <p className="leading-relaxed">
                TranSen agit en tant qu'intermédiaire technologique. Nous ne sommes pas une entreprise de transport physique, mais une plateforme d'infrastructure facilitant la gestion, la sécurité et la facturation des trajets.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                4. Paiements
              </h2>
              <p className="leading-relaxed">
                Les transactions sont gérées de manière sécurisée via nos partenaires (Wave, Orange Money). Les tarifs sont affichés avant confirmation de la course.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-green)" }}>
                5. Responsabilité
              </h2>
              <p className="leading-relaxed">
                Les chauffeurs et compagnies partenaires sont responsables du bon déroulement physique du transport. TranSen assure le support technique de la plateforme logicielle à l'adresse{" "}
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
