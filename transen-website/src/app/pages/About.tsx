import { motion } from "motion/react";
import { Target, Eye, Heart, MapPin, Users, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function About() {
  const values = [
    {
      icon: Heart,
      title: "Sécurité",
      description: "La sécurité de nos passagers et chauffeurs est notre priorité absolue",
    },
    {
      icon: TrendingUp,
      title: "Digitalisation",
      description: "Nous modernisons le transport interurbain avec la technologie",
    },
    {
      icon: Eye,
      title: "Transparence",
      description: "Des tarifs clairs et un service honnête envers tous nos utilisateurs",
    },
  ];

  const milestones = [
    { year: "2026", title: "Lancement Officiel de TranSen", description: "Déploiement de notre solution digitale innovante au Sénégal avec un taux de commission unique de 1% pour soutenir activement l'écosystème local." },
    { year: "2027", title: "Maillage National Complet", description: "Intégration d'un réseau unifié de bus, minibus et taxis interurbains couvrant l'intégralité des 14 régions du pays." },
    { year: "2028", title: "Bornes aux Gares Routières", description: "Installation de guichets interactifs et de bornes TranSen connectées dans les gares majeures pour assister tous les voyageurs." },
    { year: "2029", title: "Mobilité Verte & Sous-Région", description: "Engagement d'optimisation éco-responsable des trajets de transport et ouverture de corridors connectés vers la sous-région (Gambie, Mali, Mauritanie)." },
  ];

  const coverageRegions = [
    "Dakar", "Thiès", "Saint-Louis", "Kaolack",
    "Ziguinchor", "Diourbel", "Louga", "Fatick",
    "Tambacounda", "Kolda", "Matam", "Kaffrine",
    "Kédougou", "Sédhiou"
  ];

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
            <h1 className="text-4xl md:text-5xl text-white mb-6">
              À Propos de TranSen
            </h1>
            <p className="text-xl text-gray-100">
              La première plateforme de transport interurbain digitalisé au Sénégal
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: "var(--brand-green)" }}
              >
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl mb-6" style={{ color: "var(--brand-green)" }}>
                Notre Mission
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                TranSen se lance officiellement en 2026 avec une mission claire : révolutionner le transport interurbain au Sénégal en le rendant plus accessible, plus sûr et plus fiable pour tous.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Nous croyons que chaque Sénégalais mérite de voyager dans des conditions optimales, avec la tranquillité d'esprit que procure un service moderne et professionnel.
              </p>
              <p className="text-lg text-gray-600">
                Grâce à la technologie, nous connectons les voyageurs avec des chauffeurs vérifiés et des véhicules certifiés, tout en garantissant une transparence totale sur les tarifs et les trajets.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl overflow-hidden shadow-xl"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1740772205703-6ecc076c2160?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXMlMjBzZW5lZ2FsfGVufDF8fHx8MTc2MzEyNDA0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Transport au Sénégal"
                className="w-full h-96 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:order-2"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: "var(--brand-gold)" }}
              >
                <Eye className="w-8 h-8" style={{ color: "var(--brand-green)" }} />
              </div>
              <h2 className="text-3xl md:text-4xl mb-6" style={{ color: "var(--brand-green)" }}>
                Notre Vision
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Devenir la plateforme de mobilité la plus fiable et la plus utilisée au Sénégal, en connectant toutes les régions du pays avec un service de qualité supérieure.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Nous aspirons à être le premier choix pour tous les déplacements interurbains, en combinant innovation technologique et service humain exceptionnel.
              </p>
              <p className="text-lg text-gray-600">
                À terme, nous voulons contribuer au développement économique du Sénégal en facilitant les déplacements et en créant des opportunités pour nos chauffeurs partenaires.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:order-1 rounded-2xl overflow-hidden shadow-xl"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1595361314562-0ca40462f4f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdod2F5JTIwcm9hZCUyMHRyYXZlbHxlbnwxfHx8fDE3NjMwNTU0Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Routes du Sénégal"
                className="w-full h-96 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident notre action au quotidien
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "var(--brand-green)" }}
                >
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl mb-4" style={{ color: "var(--brand-green)" }}>
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
              Notre Feuille de Route
            </h2>
            <p className="text-xl text-gray-600">
              Nos projections et perspectives d'avenir pour 2026 - 2029
            </p>
          </motion.div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div
                  className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "var(--brand-green)" }}
                >
                  {milestone.year}
                </div>
                <div className="bg-white rounded-xl p-6 flex-1 shadow-lg">
                  <h3 className="text-xl mb-2" style={{ color: "var(--brand-green)" }}>
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "var(--brand-gold)" }}
            >
              <MapPin className="w-8 h-8" style={{ color: "var(--brand-green)" }} />
            </div>
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
              Notre Couverture Nationale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nous desservons actuellement 14 régions du Sénégal
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green)] rounded-3xl p-8 md:p-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {coverageRegions.map((region, index) => (
                <motion.div
                  key={region}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center text-white"
                >
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-[var(--brand-gold)]" />
                  <div>{region}</div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8 text-white">
              <p className="text-lg">
                Et bientôt dans encore plus de localités !
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}