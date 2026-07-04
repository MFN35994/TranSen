import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { sendContactMessage } from "../services/api";

export function Contact() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendContactMessage(formData);
      toast.success("Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.");
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        sujet: "",
        message: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "contact@transen.org",
      link: "mailto:contact@transen.org",
    },
    {
      icon: Phone,
      title: "Téléphone",
      value: "+221 78 138 64 05",
      link: "tel:+221781386405",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      value: "+221 78 138 64 05",
      link: "https://wa.me/221781386405",
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Dakar, Sénégal",
      link: "#",
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
              Contactez-Nous
            </h1>
            <p className="text-xl text-gray-200">
              Notre équipe est à votre écoute pour répondre à toutes vos questions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <motion.a
                key={info.title}
                href={info.link}
                target={info.link.startsWith("http") ? "_blank" : undefined}
                rel={info.link.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--brand-green)" }}
                >
                  <info.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="mb-2" style={{ color: "var(--brand-green)" }}>
                  {info.title}
                </h3>
                <p className="text-gray-600">{info.value}</p>
              </motion.a>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl mb-6" style={{ color: "var(--brand-green)" }}>
                Envoyez-nous un message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input
                    id="nom"
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sujet">Sujet *</Label>
                  <Input
                    id="sujet"
                    type="text"
                    required
                    value={formData.sujet}
                    onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 rounded-full text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: "var(--brand-gold)" }}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </motion.div>

            {/* Map & Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl mb-6" style={{ color: "var(--brand-green)" }}>
                  Notre localisation
                </h2>
                <div className="rounded-2xl overflow-hidden shadow-lg h-80 bg-gray-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--brand-green)" }} />
                    <h3 className="text-xl mb-2" style={{ color: "var(--brand-green)" }}>
                      Dakar, Sénégal
                    </h3>
                    <p className="text-gray-600">
                      Visitez-nous à notre siège à Dakar
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green)] rounded-2xl p-8 text-white">
                <h3 className="text-2xl mb-4">Horaires d'ouverture</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi:</span>
                    <span>8h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi:</span>
                    <span>9h00 - 14h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche:</span>
                    <span>Fermé</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-gray-200">
                    Support client disponible 24/7 via WhatsApp et l'application
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
              Actions Rapides
            </h2>
            <p className="text-xl text-gray-600">
              Besoin d'aide immédiate ? Choisissez l'option qui vous convient
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Assistance Voyage",
                description: "Problème pendant un trajet ?",
                action: "Appeler maintenant",
                link: "tel:+221781386405",
              },
              {
                title: "Devenir Chauffeur",
                description: "Rejoignez notre réseau",
                action: "Postuler",
                link: "/chauffeurs",
              },
              {
                title: "FAQ",
                description: "Questions fréquentes",
                action: "Consulter",
                link: "/faq",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 text-center shadow-lg"
              >
                <h3 className="text-xl mb-3" style={{ color: "var(--brand-green)" }}>
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-6">{item.description}</p>
                <a
                  href={item.link}
                  className="inline-block px-6 py-3 rounded-full text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: "var(--brand-green)" }}
                >
                  {item.action}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
