import { motion } from "motion/react";
import { Linkedin, Mail } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Team() {
  const teamMembers = [
    {
      name: "Mouhamadou Fadilou Ndiaye",
      role: "Fondateur & CEO & strategy",
      image: "https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Visionnaire et entrepreneur passionné, Fadilou dirige la stratégie globale d'TranSen avec une vision claire : démocratiser le transport interurbain au Sénégal.",
    },
    {
      name: "Fatoumata Kanouté",
      role: "Co-fondateur & CTO",
      image: "https://images.unsplash.com/photo-1668752741330-8adc5cef7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwd29tYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Experte en développement d'applications mobiles et web, Fatima supervise l'architecture technique de la plateforme TranSen.",
    },
    {
      name: "Mbaye Seck Mbaye",
      role: "Co-fondateur & Lead Backend Developer",
      image: "https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Spécialiste des systèmes backend et des bases de données, Seck assure la robustesse et la scalabilité de nos services.",
    },
    {
      name: "Mbaye Babacar Ndiaye",
      role: "Co-fondateur & Frontend Engineer",
      image: "https://images.unsplash.com/photo-1675383094481-3e2088da943b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3NtYW58ZW58MXx8fHwxNzYzMTI0MDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      bio: "Designer et développeur frontend talentueux, babacar crée des interfaces intuitives et élégantes pour une expérience utilisateur optimale.",
    },
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
              Notre Équipe
            </h1>
            <p className="text-xl text-gray-200">
              Rencontrez les personnes passionnées qui construisent l'avenir du transport au Sénégal
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="aspect-square overflow-hidden">
                  <ImageWithFallback
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl mb-2" style={{ color: "var(--brand-green)" }}>
                    {member.name}
                  </h3>
                  <div
                    className="mb-4 inline-block px-4 py-1 rounded-full"
                    style={{ backgroundColor: "var(--brand-gold)", color: "var(--brand-green)" }}
                  >
                    {member.role}
                  </div>
                  <p className="text-gray-600 mb-6">
                    {member.bio}
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: "var(--brand-green)" }}
                    >
                      <Linkedin className="w-5 h-5 text-white" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: "var(--brand-green)" }}
                    >
                      <Mail className="w-5 h-5 text-white" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green)] rounded-3xl p-8 md:p-12 text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl mb-6">
              Rejoignez Notre Aventure
            </h2>
            <p className="text-xl mb-8 text-gray-200">
              Nous recherchons des talents passionnés pour nous aider à transformer la mobilité au Sénégal
            </p>
            <a
              href="mailto:contact@allodakar.com"
              className="inline-block px-8 py-4 rounded-full transition-all hover:shadow-xl"
              style={{ backgroundColor: "var(--brand-gold)", color: "var(--brand-green)" }}
            >
              Postuler maintenant
            </a>
          </motion.div>
        </div>
      </section>

      {/* Culture & Values */}
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
              Notre Culture
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Les valeurs qui unissent notre équipe
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Innovation",
                description: "Nous encourageons la créativité et l'exploration de nouvelles idées",
              },
              {
                title: "Collaboration",
                description: "Le travail d'équipe est au cœur de notre succès",
              },
              {
                title: "Excellence",
                description: "Nous visons l'excellence dans tout ce que nous faisons",
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 text-center"
              >
                <h3 className="text-2xl mb-4" style={{ color: "var(--brand-green)" }}>
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
