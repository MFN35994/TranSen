import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export function FAQ() {
  const faqCategories = [
    {
      category: "Réservation",
      questions: [
        {
          question: "Comment réserver un trajet sur TranSen ?",
          answer: "Téléchargez notre application, créez un compte, sélectionnez votre point de départ et votre destination, choisissez votre horaire et confirmez votre réservation. C'est simple et rapide !",
        },
        {
          question: "Puis-je réserver pour plusieurs personnes ?",
          answer: "Oui, vous pouvez réserver jusqu'à 4 places simultanément lors d'une même réservation. Il suffit d'indiquer le nombre de passagers lors de votre réservation.",
        },
        {
          question: "Combien de temps à l'avance dois-je réserver ?",
          answer: "Nous recommandons de réserver au moins 2 heures à l'avance, mais vous pouvez réserver jusqu'à 30 jours avant votre départ.",
        },
        {
          question: "Puis-je choisir mon siège ?",
          answer: "Oui, notre application vous permet de visualiser les sièges disponibles et de choisir celui qui vous convient le mieux.",
        },
      ],
    },
    {
      category: "Annulation",
      questions: [
        {
          question: "Comment annuler ma réservation ?",
          answer: "Rendez-vous dans votre espace 'Mes Réservations' sur l'application et cliquez sur 'Annuler'. Vous recevrez une confirmation par SMS.",
        },
        {
          question: "Puis-je être remboursé en cas d'annulation ?",
          answer: "Oui, si vous annulez plus de 24 heures avant le départ, vous serez remboursé à 100%. Entre 12 et 24 heures, le remboursement est de 50%. Moins de 12 heures, aucun remboursement n'est possible.",
        },
        {
          question: "Que se passe-t-il si le chauffeur annule ?",
          answer: "En cas d'annulation par le chauffeur, vous serez immédiatement remboursé à 100% et nous vous proposerons des alternatives pour votre trajet.",
        },
      ],
    },
    {
      category: "Paiement",
      questions: [
        {
          question: "Quels modes de paiement acceptez-vous ?",
          answer: "Nous acceptons Orange Money, Wave et Free Money. Tous les paiements sont sécurisés et instantanés.",
        },
        {
          question: "Le paiement est-il sécurisé ?",
          answer: "Absolument ! Nous utilisons les dernières technologies de cryptage pour protéger toutes vos transactions. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
        },
        {
          question: "Puis-je payer en espèces ?",
          answer: "Pour le moment, nous n'acceptons que les paiements mobiles (Mobile Money). Cela garantit la sécurité et la traçabilité de toutes les transactions.",
        },
        {
          question: "Recevrai-je un reçu de paiement ?",
          answer: "Oui, un reçu électronique vous sera envoyé par email et SMS immédiatement après chaque paiement.",
        },
      ],
    },
    {
      category: "Sécurité",
      questions: [
        {
          question: "Comment les chauffeurs sont-ils vérifiés ?",
          answer: "Tous nos chauffeurs passent par un processus de vérification rigoureux incluant la validation du permis de conduire, la vérification du casier judiciaire et une formation sur les standards de sécurité.",
        },
        {
          question: "Les véhicules sont-ils contrôlés ?",
          answer: "Oui, tous les véhicules sur notre plateforme doivent passer des inspections techniques régulières et disposer d'une assurance à jour.",
        },
        {
          question: "Puis-je suivre mon trajet en temps réel ?",
          answer: "Oui, grâce au suivi GPS en temps réel, vous pouvez voir exactement où se trouve votre véhicule et partager votre position avec vos proches.",
        },
        {
          question: "Que faire en cas de problème pendant le trajet ?",
          answer: "Notre support client est disponible 24/7. Vous pouvez nous contacter immédiatement via l'application ou par téléphone au +221 78 138 64 05.",
        },
      ],
    },
    {
      category: "Support",
      questions: [
        {
          question: "Comment contacter le support client ?",
          answer: "Vous pouvez nous joindre par téléphone (+221 78 138 64 05), WhatsApp, email (contact@allodakar.com) ou directement via l'application. Notre équipe est disponible 24/7.",
        },
        {
          question: "Combien de temps faut-il pour recevoir une réponse ?",
          answer: "Notre équipe répond généralement en moins de 30 minutes pendant les heures ouvrables et sous 2 heures maximum en dehors de ces heures.",
        },
        {
          question: "Puis-je modifier ma réservation après confirmation ?",
          answer: "Oui, vous pouvez modifier votre réservation jusqu'à 2 heures avant le départ en contactant notre support ou directement via l'application.",
        },
        {
          question: "Proposez-vous un programme de fidélité ?",
          answer: "Oui ! Chaque trajet vous permet d'accumuler des points que vous pouvez utiliser pour obtenir des réductions sur vos prochains voyages.",
        },
      ],
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
              Questions Fréquentes
            </h1>
            <p className="text-xl text-gray-200">
              Trouvez rapidement les réponses à vos questions sur TranSen
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              >
                <h2
                  className="text-2xl md:text-3xl mb-6 pb-3 border-b-2"
                  style={{ color: "var(--brand-green)", borderColor: "var(--brand-gold)" }}
                >
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${categoryIndex}-${index}`}
                      className="bg-gray-50 rounded-xl px-6 border-none"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <span style={{ color: "var(--brand-green)" }}>
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 pt-2">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions CTA */}
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
              Vous n'avez pas trouvé votre réponse ?
            </h2>
            <p className="text-xl mb-8 text-gray-200">
              Notre équipe est là pour vous aider
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@allodakar.com"
                className="px-8 py-4 rounded-full transition-all hover:shadow-xl inline-block"
                style={{ backgroundColor: "var(--brand-gold)", color: "var(--brand-green)" }}
              >
                Envoyer un email
              </a>
              <a
                href="https://wa.me/221781386405"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white text-white transition-all hover:bg-white hover:text-[var(--brand-green)] inline-block"
              >
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
