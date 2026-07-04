import { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, Shield, Users, Clock, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { registerChauffeur } from "../services/api";

export function Chauffeurs() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    region: "",
    typeVehicule: "",
    numeroCNI: "",
    experience: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Map form fields to the API payload schema
      await registerChauffeur({
        nom: formData.nom,
        prenom: formData.prenom,
        email: `${formData.prenom.toLowerCase()}.${formData.nom.toLowerCase()}@transen.partner`, // derived for schema fallback
        telephone: formData.telephone,
        region: formData.region,
        permisType: formData.numeroCNI, // maps to license/ID/CNI in payload
        vehiculeType: formData.typeVehicule,
        description: `Expérience: ${formData.experience}`,
      });
      toast.success("Candidature envoyée avec succès ! Nous vous contacterons bientôt.");
      setFormData({
        nom: "",
        prenom: "",
        telephone: "",
        region: "",
        typeVehicule: "",
        numeroCNI: "",
        experience: "",
      });
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue lors de l'envoi de votre candidature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const advantages = [
    {
      icon: TrendingUp,
      title: "Plus de clients",
      description: "Accédez à une base croissante de voyageurs réguliers",
    },
    {
      icon: DollarSign,
      title: "Revenus garantis",
      description: "Paiements sécurisés et rapides directement sur votre compte",
    },
    {
      icon: Shield,
      title: "Sécurité renforcée",
      description: "Protection et assurance pour vous et vos passagers",
    },
    {
      icon: Clock,
      title: "Flexibilité totale",
      description: "Choisissez vos horaires et itinéraires selon vos disponibilités",
    },
    {
      icon: Users,
      title: "Communauté active",
      description: "Rejoignez un réseau de chauffeurs professionnels",
    },
    {
      icon: CheckCircle,
      title: "Support dédié",
      description: "Assistance 24/7 pour vous accompagner au quotidien",
    },
  ];

  const requirements = [
    "Permis de conduire valide (catégorie appropriée)",
    "Carte d'identité nationale (CNI) valide",
    "Véhicule en bon état avec assurance à jour",
    "Minimum 2 ans d'expérience de conduite",
    "Casier judiciaire vierge",
    "Smartphone avec connexion internet",
  ];

  const regions = [
    "Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor",
    "Diourbel", "Louga", "Fatick", "Tambacounda", "Kolda",
    "Matam", "Kaffrine", "Kédougou", "Sédhiou"
  ];

  const vehicleTypes = [
    "Voiture de tourisme (4-7 places)",
    "Mini-bus (8-15 places)",
    "Bus (16+ places)",
    "Van climatisé",
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
              Devenez Chauffeur Partenaire TranSen
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Rejoignez la première plateforme de transport interurbain digitalisé au Sénégal
            </p>
            <div className="inline-block px-6 py-3 rounded-full" style={{ backgroundColor: "var(--brand-gold)" }}>
              <span style={{ color: "var(--brand-green)" }}>
                + de 200 chauffeurs nous font déjà confiance
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Advantages */}
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
              Pourquoi devenir partenaire ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des avantages concrets pour développer votre activité
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <motion.div
                key={advantage.title}
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
                  <advantage.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3" style={{ color: "var(--brand-green)" }}>
                  {advantage.title}
                </h3>
                <p className="text-gray-600">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
              Conditions requises
            </h2>
            <p className="text-xl text-gray-600">
              Assurez-vous de remplir ces critères avant de postuler
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {requirements.map((requirement, index) => (
                <motion.div
                  key={requirement}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "var(--brand-green)" }} />
                  <span className="text-gray-700">{requirement}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Registration Form & Live Badge Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: "var(--brand-green)" }}>
              Formulaire d'inscription & Badge de Qualification
            </h2>
            <p className="text-xl text-gray-600">
              Remplissez ce formulaire et visualisez en direct votre Carte Professionnelle Digitale
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7 bg-gray-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      type="text"
                      required
                      placeholder="Sow"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      type="text"
                      required
                      placeholder="Mamadou"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="telephone">Numéro WhatsApp *</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      required
                      placeholder="+221 77 123 45 67"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Région d'opération *</Label>
                    <select
                      id="region"
                      required
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="mt-2 w-full px-3 py-2.5 rounded-lg border bg-white text-sm"
                    >
                      <option value="">Sélectionnez une région</option>
                      {regions.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="typeVehicule">Type de véhicule *</Label>
                  <select
                    id="typeVehicule"
                    required
                    value={formData.typeVehicule}
                    onChange={(e) => setFormData({ ...formData, typeVehicule: e.target.value })}
                    className="mt-2 w-full px-3 py-2.5 rounded-lg border bg-white text-sm"
                  >
                    <option value="">Sélectionnez un type</option>
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="numeroCNI">Numéro CNI *</Label>
                    <Input
                      id="numeroCNI"
                      type="text"
                      required
                      placeholder="1 254 1990 01482"
                      value={formData.numeroCNI}
                      onChange={(e) => setFormData({ ...formData, numeroCNI: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Années d'expérience *</Label>
                    <Input
                      id="experience"
                      type="number"
                      required
                      min="2"
                      placeholder="5"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 rounded-2xl text-gray-900 font-extrabold uppercase text-sm tracking-wider transition-all hover:shadow-xl disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: "var(--brand-gold)" }}
                >
                  {isSubmitting ? "Envoi de la candidature..." : "Soumettre mon dossier"}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  * Vos coordonnées restent confidentielles. Validation de dossier sous 48h.
                </p>
              </form>
            </motion.div>

            {/* Interactive Live Holographic Card Preview Column */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono tracking-widest text-[#FFD700] uppercase font-bold">Aperçu en Direct</span>
                  <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase">Carte Active</span>
                </div>

                {/* The Holographic ID Card */}
                <motion.div
                  layout
                  className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 rounded-2xl overflow-hidden border border-white/10 p-5 shadow-2xl min-h-[250px] flex flex-col justify-between"
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.1)"
                  }}
                >
                  {/* Subtle moving holographic linear sheen */}
                  <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[sheen_6s_ease-in-out_infinite] pointer-events-none" />

                  {/* Red/Yellow/Green Senegal stripe tag on right corner */}
                  <div className="absolute top-0 right-0 w-16 h-1 border-t-4 border-r-4 border-emerald-500 flex">
                    <div className="w-1/3 h-1 bg-emerald-500" />
                    <div className="w-1/3 h-1 bg-yellow-500" />
                    <div className="w-1/3 h-1 bg-red-500" />
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-500">République du Sénégal</span>
                      <h4 className="text-xs font-black text-white tracking-widest uppercase mt-0.5">Partenaire Chauffeur</h4>
                    </div>
                    <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-mono font-bold">
                      TS-2026
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex gap-4 my-4 items-center">
                    {/* Picture box with shiny indicator */}
                    <div className="w-16 h-16 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                      <Users className="w-8 h-8 text-slate-600" />
                      {formData.nom && (
                        <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-400 fill-emerald-950 animate-bounce" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5 text-xs font-mono">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block leading-none">Nom complet</span>
                        <span className="text-white font-bold block truncate text-sm">
                          {formData.prenom || formData.nom 
                            ? `${formData.prenom} ${formData.nom}`.trim() 
                            : "Mamadou Sow"
                          }
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2">
                        <div>
                          <span className="text-[8px] text-zinc-500 uppercase block leading-none">Région</span>
                          <span className="text-zinc-300 font-bold block truncate">
                            {formData.region || "Dakar"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-zinc-500 uppercase block leading-none">Véhicule</span>
                          <span className="text-zinc-300 font-bold block truncate">
                            {formData.typeVehicule ? formData.typeVehicule.split(" ")[0] : "Mini-bus"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] font-mono">
                    <div>
                      <span className="text-zinc-500 block leading-none">Identifiant de Validation</span>
                      <span className="text-zinc-300 font-bold">CNI: {formData.numeroCNI || "•••• •••• ••••"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block leading-none">Statut Plateforme</span>
                      <span className="text-[#FFD700] font-bold flex items-center gap-1 mt-0.5 justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        En attente de soumission
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Additional contextual instructions */}
                <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-zinc-100">Intégration Authentifiée KYC</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Toutes nos cartes partenaires sont certifiées cryptographiquement avec un QR code de validation opérationnel. Ce badge facilitera la vérification lors des contrôles routiers syndicaux et de gares.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Styled inline sheen transition animation */}
      <style>{`
        @keyframes sheen {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
