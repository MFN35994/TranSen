import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Calendar, Users, Search, Bus, Car, Package,
  ChevronDown, Clock, ArrowRight, Star, CheckCircle, X
} from "lucide-react";
import { toast } from "sonner";
import { fetchTrips, createBooking, Trip, searchTripsApi, requestAlloDakarTrip, getTripStatus, cancelAlloDakarTrip } from "../services/api";

const SENEGAL_CITIES = [
  "Dakar", "Thiès", "Touba", "Kaolack", "Saint-Louis", "Ziguinchor",
  "Tambacounda", "Louga", "Kolda", "Diourbel", "Fatick", "Kaffrine",
  "Sédhiou", "Matam", "Mbour", "Rufisque", "Pikine", "Guédiawaye"
];

type ServiceType = "bus_company" | "allo_dakar" | "yobante";

const SERVICES: { id: ServiceType; label: string; sub: string; Icon: typeof Bus }[] = [
  { id: "bus_company", label: "Compagnies", sub: "Bus · Horaires fixes", Icon: Bus },
  { id: "allo_dakar", label: "Allô Dakar", sub: "VTC · Départ immédiat", Icon: Car },
  { id: "yobante", label: "Yobante", sub: "Colis · Interurbain", Icon: Package },
];

interface BusTrip { id: string; company: string; dep: string; arr: string; available: number; total: number; price: string; vehicle: string; rating: number; }
interface VtcRide { id: string; driver: string; rating: number; car: string; seats: number; price: string; eta: string; }
interface ColisOffer { id: string; type: string; price: string; delay: string; insurance: string; }

function genBus(): BusTrip[] {
  return [
    { id: "b1", company: "MACHALLA Transport", dep: "08:00", arr: "11:30", available: 42, total: 60, price: "3 500", vehicle: "Grand Bus 60 places", rating: 4.8 },
    { id: "b2", company: "TranSen Express", dep: "12:00", arr: "15:30", available: 3, total: 15, price: "4 000", vehicle: "Minibus 15 places", rating: 4.9 },
    { id: "b3", company: "Sénégal Voyages", dep: "16:00", arr: "19:30", available: 21, total: 30, price: "3 200", vehicle: "Bus VIP 30 places", rating: 4.7 },
    { id: "b4", company: "Dakar Bus VIP", dep: "20:00", arr: "23:30", available: 45, total: 60, price: "5 000", vehicle: "Grand Bus VIP 60 places", rating: 5.0 },
  ];
}
function genVtc(): VtcRide[] {
  return [
    { id: "v1", driver: "Moussa D.", rating: 4.8, car: "Toyota Corolla (Allô Dakar)", seats: 4, price: "5 000", eta: "5 min" },
    { id: "v2", driver: "Cheikh N.", rating: 4.9, car: "Peugeot 508 (Allô Dakar)", seats: 4, price: "5 500", eta: "8 min" },
    { id: "v3", driver: "Ibrahima S.", rating: 4.7, car: "Renault Logan (Allô Dakar)", seats: 4, price: "4 800", eta: "12 min" },
  ];
}
function genColis(): ColisOffer[] {
  return [
    { id: "c1", type: "Standard (< 5 kg)", price: "2 000", delay: "Même jour", insurance: "Incluse" },
    { id: "c2", type: "Large (5 – 20 kg)", price: "4 500", delay: "Même jour", insurance: "Incluse" },
    { id: "c3", type: "Express Prioritaire", price: "6 000", delay: "< 2 heures", insurance: "Renforcée" },
  ];
}

/* ─── City Dropdown ─────────────────────────────────────────────────── */
function CityPicker({ label, value, onChange, exclude }: { label: string; value: string; onChange: (v: string) => void; exclude?: string }) {
  const [open, setOpen] = useState(false);
  const cities = SENEGAL_CITIES.filter(c => c !== exclude);
  return (
    <div className="relative">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl px-4 py-3 text-left hover:bg-white/15 transition-all"
      >
        <MapPin className="w-4 h-4 text-white/50 shrink-0" />
        <span className="flex-1 truncate">{value || <span className="text-white/40">{label}</span>}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto border border-gray-100"
          >
            {cities.map(city => (
              <button
                key={city}
                onClick={() => { onChange(city); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                {city}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Seat Map ──────────────────────────────────────────────────────── */
function SeatBtn({ n, occupied, selected, onClick }: { n: number; occupied: boolean; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={occupied}
      title={occupied ? "Occupé" : `Siège ${n}`}
      className={`w-9 h-9 rounded-lg text-xs transition-all border-2 ${
        occupied
          ? "bg-blue-50 border-blue-200 text-blue-300 cursor-not-allowed"
          : selected
          ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-gray-900"
          : "bg-green-50 border-green-300 text-green-700 hover:border-green-500 hover:bg-green-100"
      }`}
    >
      {n}
    </button>
  );
}

function SeatMap({ total, occupied, selected, onToggle }: { total: number; occupied: number[]; selected: number[]; onToggle: (n: number) => void }) {
  const isLargeBus = total > 15;
  const cols = isLargeBus ? 4 : 3;
  const rows = Math.ceil(total / cols);

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[300px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Avant du véhicule</span>
        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm">🚐</div>
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-1.5 items-center justify-center">
            {/* Left group */}
            <SeatBtn
              n={r * cols + 1}
              occupied={occupied.includes(r * cols + 1)}
              selected={selected.includes(r * cols + 1)}
              onClick={() => onToggle(r * cols + 1)}
            />
            <SeatBtn
              n={r * cols + 2}
              occupied={occupied.includes(r * cols + 2)}
              selected={selected.includes(r * cols + 2)}
              onClick={() => onToggle(r * cols + 2)}
            />

            {/* Aisle Spacer */}
            <div className="w-5 text-center text-[9px] text-gray-300 font-mono">Allée</div>

            {/* Right group */}
            <SeatBtn
              n={r * cols + 3}
              occupied={occupied.includes(r * cols + 3)}
              selected={selected.includes(r * cols + 3)}
              onClick={() => onToggle(r * cols + 3)}
            />
            {isLargeBus && (r * cols + 4 <= total) && (
              <SeatBtn
                n={r * cols + 4}
                occupied={occupied.includes(r * cols + 4)}
                selected={selected.includes(r * cols + 4)}
                onClick={() => onToggle(r * cols + 4)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-200/50 justify-center text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-50 border border-green-300 inline-block" /> Libre</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-200 inline-block" /> Occupé</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--brand-gold)] inline-block" /> Sélectionné</span>
      </div>
    </div>
  );
}

/* ─── Bus Result Card ───────────────────────────────────────────────── */
interface BusCardProps {
  trip: BusTrip;
  wantedSeats: number;
  onBookingSuccess?: (ticket: {
    id: string;
    company: string;
    vehicle: string;
    dep: string;
    arr: string;
    seats: number[];
    totalCost: number;
    routingType: "specific" | "public";
    passengerName: string;
    passengerEmail: string;
    passengerPhone: string;
    dateReservation: string;
  }) => void;
}

function BusCard({ trip, wantedSeats, onBookingSuccess }: BusCardProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [routingType, setRoutingType] = useState<"specific" | "public">("specific");
  
  // États passager pour l'API réelle
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcul dynamique des sièges occupés
  const occupiedCount = trip.total - trip.available;
  const occupied = Array.from({ length: trip.total })
    .map((_, idx) => idx + 1)
    .filter(n => (n % 3 === 0 || n % 7 === 1) && n <= trip.total)
    .slice(0, occupiedCount);

  const toggle = (n: number) => {
    if (occupied.includes(n)) return;
    setSelected(s =>
      s.includes(n) ? s.filter(x => x !== n) : s.length < wantedSeats ? [...s, n] : s
    );
  };

  const calculateTotalCost = () => {
    const rawPrice = Number(trip.price.replace(/\s/g, ""));
    return rawPrice * wantedSeats;
  };

  const book = async () => {
    if (selected.length < wantedSeats) {
      toast.info(`Sélectionnez d'abord vos ${wantedSeats} sièges.`);
      setOpen(true);
      return;
    }

    if (!passengerName || !passengerEmail || !passengerPhone) {
      toast.info("Veuillez remplir vos coordonnées passager pour la réservation.");
      setOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const priceNum = calculateTotalCost();
      const transenComm = Math.round((priceNum * 1) / 100);
      const companyEarn = priceNum - transenComm;

      // Appeler le backend Spring Boot pour insérer le billet en base de données
      const bookingResult = await createBooking({
        tripId: trip.id,
        passagerNom: passengerName,
        passagerEmail: passengerEmail,
        passagerPhone: passengerPhone,
        siegeNumero: selected.join(", "),
        prixTTC: priceNum,
        statutReglement: routingType === "specific" ? "Réglé" : "En attente",
        modePaiement: routingType === "specific" ? "Wave" : "Espèces (Gare)"
      });

      if (onBookingSuccess) {
        onBookingSuccess({
          id: bookingResult.id,
          company: trip.company,
          vehicle: trip.vehicle,
          dep: trip.dep,
          arr: trip.arr,
          seats: selected,
          totalCost: priceNum,
          routingType,
          passengerName,
          passengerEmail,
          passengerPhone,
          dateReservation: bookingResult.dateReservation
        });
      }

      toast.success(
        routingType === "specific"
          ? `🎟️ Réservation Spécifique validée ! SenePay en ligne : ${priceNum.toLocaleString()} FCFA.`
          : `🎟️ Demande Publique enregistrée ! Règlement direct en espèces de ${priceNum.toLocaleString()} FCFA.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création de la réservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div layout className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-gray-900 font-bold truncate">{trip.company}</span>
            <span className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: "var(--brand-gold)" }}>
              <Star className="w-3 h-3 fill-[var(--brand-gold)] animate-pulse" />
              {trip.rating}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-700">{trip.dep}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-semibold text-gray-700">{trip.arr}</span>
            <span className="text-gray-300">·</span>
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-emerald-100">{trip.vehicle}</span>
          </div>
          {/* Seat bar indicator */}
          <div className="flex gap-0.5 mt-3">
            {Array.from({ length: trip.total }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < trip.available ? "bg-green-400" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold" style={{ color: "var(--brand-green)" }}>{trip.price} <span className="text-xs text-gray-400">FCFA</span></div>
          <div className={`text-xs mt-0.5 font-medium ${trip.available <= 3 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {trip.available} place{trip.available > 1 ? "s" : ""} dispo
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2 bg-gray-50/50 pt-2 border-t border-gray-50">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 py-2 rounded-xl border text-sm font-semibold transition-all hover:bg-gray-50 cursor-pointer"
          style={{ borderColor: "var(--brand-green)", color: "var(--brand-green)" }}
        >
          {open ? "Masquer les détails" : "Sélectionner mes places"}
        </button>
        <button
          onClick={book}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
          style={{ backgroundColor: "var(--brand-green)" }}
        >
          {routingType === "specific" ? "Réserver · SenePay" : "Réserver · Espèces"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white"
          >
            <div className="p-4 grid md:grid-cols-12 gap-5">
              {/* Seat Selection Panel */}
              <div className="md:col-span-6">
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  Sélectionnez vos places ({selected.length}/{wantedSeats})
                </p>
                <SeatMap total={trip.total} occupied={occupied} selected={selected} onToggle={toggle} />
              </div>

              {/* Specific/Public routing selections */}
              <div className="md:col-span-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase font-mono">Informations Passager</p>
                  <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nom complet du passager *"
                      required
                      value={passengerName}
                      onChange={e => setPassengerName(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Email *"
                        required
                        value={passengerEmail}
                        onChange={e => setPassengerEmail(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Téléphone *"
                        required
                        value={passengerPhone}
                        onChange={e => setPassengerPhone(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase font-mono">Option de Routage & Paiement</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => setRoutingType("specific")}
                      className={`p-2.5 text-xs rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        routingType === "specific"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span>Demande Spécifique</span>
                      <span className="text-[9px] leading-tight font-normal">Paiement d'avance via SenePay. 99% à la compagnie.</span>
                    </button>
                    <button
                      onClick={() => setRoutingType("public")}
                      className={`p-2.5 text-xs rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        routingType === "public"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span>Demande Publique</span>
                      <span className="text-[9px] leading-tight font-normal">Envoi global. Paiement obligatoire espèces à bord.</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/50 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tarif unitaire :</span>
                      <span className="font-bold text-gray-800">{trip.price} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Places choisies :</span>
                      <span className="font-bold text-gray-800">{selected.length || wantedSeats} place(s)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-gray-205 text-gray-900 font-bold">
                      <span>Total à payer :</span>
                      <span style={{ color: "var(--brand-green)" }}>{calculateTotalCost().toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    onClick={book}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: "var(--brand-green)" }}
                  >
                    {routingType === "specific"
                      ? `Régler ${calculateTotalCost().toLocaleString()} FCFA par SenePay`
                      : "S'enregistrer (Payer en Espèces à bord)"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── VTC Card ──────────────────────────────────────────────────────── */
function VtcCard({ ride }: { ride: VtcRide }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "var(--brand-green)" + "20" }}>🚐</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{ride.driver}</span>
            <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--brand-gold)" }}>
              <Star className="w-3 h-3 fill-[var(--brand-gold)]" />{ride.rating}
            </span>
          </div>
          <div className="text-sm text-gray-500">{ride.car} · {ride.seats} places · ETA {ride.eta}</div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div style={{ color: "var(--brand-green)" }}>{ride.price} FCFA</div>
        <button
          onClick={() => toast.success(`🚗 ${ride.driver} contacté ! Arrivée dans ${ride.eta}`)}
          className="mt-2 px-4 py-1.5 rounded-xl text-sm text-white"
          style={{ backgroundColor: "var(--brand-green)" }}
        >
          Réserver
        </button>
      </div>
    </div>
  );
}

/* ─── Colis Card ────────────────────────────────────────────────────── */
function ColisCard({ offer }: { offer: ColisOffer }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex items-center justify-between gap-3">
      <div>
        <div className="text-gray-900">{offer.type}</div>
        <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          {offer.delay} · Assurance {offer.insurance}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div style={{ color: "var(--brand-green)" }}>{offer.price} FCFA</div>
        <button
          onClick={() => toast.success(`📦 Envoi initié ! Code de suivi généré.`)}
          className="mt-2 px-4 py-1.5 rounded-xl text-sm"
          style={{ backgroundColor: "var(--brand-gold)", color: "#1a1a1a" }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

/* ─── Main Widget ───────────────────────────────────────────────────── */
export function TripBookingWidget() {
  const [service, setService] = useState<ServiceType>("bus_company");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [seats, setSeats] = useState(1);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BusTrip[] | VtcRide[] | ColisOffer[] | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [activeAlloDakarTripId, setActiveAlloDakarTripId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("transen_active_trip_id");
    }
    return null;
  });
  const [trackedTrip, setTrackedTrip] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (activeAlloDakarTripId) {
      localStorage.setItem("transen_active_trip_id", activeAlloDakarTripId);
    }
  }, [activeAlloDakarTripId]);

  useEffect(() => {
    if (!activeAlloDakarTripId) return;

    getTripStatus(activeAlloDakarTripId).then(setTrackedTrip).catch(console.error);

    const intervalId = setInterval(async () => {
      try {
        const trip = await getTripStatus(activeAlloDakarTripId);
        setTrackedTrip(trip);
        if (trip && (trip.status === "COMPLETED" || trip.status === "CANCELLED")) {
          localStorage.removeItem("transen_active_trip_id");
        }
      } catch (err) {
        console.error("Erreur lors du suivi du trajet:", err);
      }
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeAlloDakarTripId]);

  const handleCancelTrip = async () => {
    if (!activeAlloDakarTripId) return;
    if (!window.confirm("Êtes-vous sûr de vouloir annuler votre demande de trajet ? Cette action est irréversible.")) {
      return;
    }
    setCancelling(true);
    try {
      await cancelAlloDakarTrip(activeAlloDakarTripId);
      toast.success("Votre demande de trajet a été annulée.");
      setTrackedTrip((prev: any) => prev ? { ...prev, status: "CANCELLED" } : null);
      localStorage.removeItem("transen_active_trip_id");
      setTimeout(() => {
        setActiveAlloDakarTripId(null);
        setTrackedTrip(null);
      }, 2000);
    } catch (err: any) {
      console.error("Erreur d'annulation:", err);
      toast.error(err.message || "Impossible d'annuler le trajet.");
    } finally {
      setCancelling(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSearch = async () => {
    if (service !== "yobante" && (!from || !to)) {
      toast.error("Veuillez choisir une ville de départ et de destination");
      return;
    }
    if (service !== "yobante" && from === to) {
      toast.error("Départ et destination doivent être différents");
      return;
    }
    setSearching(true);
    setResults(null);
    
    try {
      if (service === "bus_company") {
        const apiTrips = await searchTripsApi(from, to, date);
        
        if (!apiTrips || apiTrips.length === 0) {
          toast.info(`Aucune compagnie disponible de ${from} vers ${to} à la date du ${new Date(date).toLocaleDateString("fr-FR")}.`);
          setResults([]);
        } else {
          setResults(apiTrips.map((apiTrip: any) => {
            const heureDepart = apiTrip.heure || "08:00";
            const [h, m] = heureDepart.split(":").map(Number);
            const arrHour = ((h || 8) + 3) % 24;
            const arrMin = ((m || 0) + 30) % 60;
            const formattedArr = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
            
            return {
              id: apiTrip.id,
              company: apiTrip.compagnie || "Compagnie Partenaire",
              dep: heureDepart,
              arr: formattedArr,
              available: apiTrip.placesDispo,
              total: apiTrip.placesMax,
              price: (apiTrip.prix || 5000).toString(),
              vehicle: apiTrip.type || "Bus",
              rating: 4.8
            };
          }));
        }
      } else if (service === "allo_dakar") {
        if (!passengerName.trim() || !passengerPhone.trim()) {
          toast.error("Veuillez renseigner votre nom et votre numéro de téléphone pour envoyer la demande.");
          setSearching(false);
          return;
        }

        const price = 4500; 

        const trip = await requestAlloDakarTrip({
          passengerPhone: passengerPhone.trim(),
          passengerName: passengerName.trim(),
          pickupLocation: from,
          dropoffLocation: to,
          price: price
        });

        if (trip && trip.id) {
          setActiveAlloDakarTripId(trip.id);
          toast.success("Votre demande de trajet Allo Dakar a été envoyée aux chauffeurs en ligne !");
        } else {
          throw new Error("Impossible d'obtenir l'identifiant du trajet créé.");
        }
      } else {
        setResults([
          { id: "c1", type: "Standard (< 5 kg)", price: "2500", delay: "24h maximum", insurance: "Incluse" },
          { id: "c2", type: "Large (5 – 20 kg)", price: "4500", delay: "24h maximum", insurance: "Incluse" },
          { id: "c3", type: "Très large (> 20 kg)", price: "8000", delay: "24-48h", insurance: "Optionnelle" }
        ] as any);
      }
    } catch (err: any) {
      console.error("API error during search/request:", err);
      toast.error(err.message || "Une erreur est survenue lors de la connexion avec le serveur.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full">
      {activeAlloDakarTripId ? (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white mb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-12 -translate-y-12" />
          
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚗</span>
              <span className="font-extrabold text-[#FFD700] tracking-wider text-xs font-mono uppercase">Suivi en direct Allô Dakar</span>
            </div>
            <button 
              onClick={() => {
                setActiveAlloDakarTripId(null);
                setTrackedTrip(null);
                toast.info("Suivi du trajet fermé.");
              }}
              className="p-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition text-xs font-bold"
            >
              Fermer le suivi
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase block tracking-wider">Départ</span>
              <span className="text-xl font-bold text-white">{from || "Dakar"}</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-5 h-5 text-[#FFD700] animate-pulse" />
              <span className="text-[9px] text-[#FFD700] mt-0.5 font-mono">En ligne</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-mono uppercase block tracking-wider">Destination</span>
              <span className="text-xl font-bold text-white">{to || "Thiès"}</span>
            </div>
          </div>

          {trackedTrip ? (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-[10px] text-white/50 block font-mono uppercase mb-1">Statut de la demande</span>
                <div className="flex items-center gap-2.5">
                  {trackedTrip.status === "PENDING" && (
                    <>
                      <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-sm font-bold text-[#FFD700]">Recherche de chauffeur en cours...</span>
                    </>
                  )}
                  {trackedTrip.status === "ACCEPTED" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-500/10 shrink-0" />
                      <span className="text-sm font-bold text-emerald-400">Demande acceptée par un chauffeur !</span>
                    </>
                  )}
                  {trackedTrip.status === "IN_PROGRESS" && (
                    <>
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-sm font-bold text-blue-400">Course en cours... Bon voyage !</span>
                    </>
                  )}
                  {trackedTrip.status === "COMPLETED" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-emerald-500">Course terminée avec succès !</span>
                    </>
                  )}
                  {trackedTrip.status === "CANCELLED" && (
                    <>
                      <X className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-sm font-bold text-red-500">Course annulée.</span>
                    </>
                  )}
                </div>
                {trackedTrip.status === "PENDING" && (
                  <p className="text-xs text-white/60 mt-2 font-mono leading-relaxed">
                    Votre demande a été envoyée en temps réel et est actuellement affichée sur l'application des chauffeurs Allô Dakar. Veuillez patienter, un chauffeur va l'accepter d'un instant à l'autre.
                  </p>
                )}
              </div>

              {(trackedTrip.status === "ACCEPTED" || trackedTrip.status === "IN_PROGRESS" || trackedTrip.status === "COMPLETED") && (
                <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 space-y-3">
                  <span className="text-[10px] text-emerald-400 block font-mono uppercase">Votre Chauffeur</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold block">{trackedTrip.driverName || "Chauffeur Allô Dakar"}</span>
                      <span className="text-xs text-[#FFD700] flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-[#FFD700]" /> 4.9 · Véhicule vérifié TranSen
                      </span>
                    </div>
                    {trackedTrip.driverPhone && (
                      <a 
                        href={`tel:${trackedTrip.driverPhone}`}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl transition duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        📞 Appeler ({trackedTrip.driverPhone})
                      </a>
                    )}
                  </div>
                </div>
              )}
              {(trackedTrip.status === "PENDING" || trackedTrip.status === "ACCEPTED" || trackedTrip.status === "IN_PROGRESS") && (
                <button
                  onClick={handleCancelTrip}
                  disabled={cancelling}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition text-xs font-bold mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {cancelling ? "Annulation en cours..." : "🚫 Annuler ma demande de trajet"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs text-white/50">Connexion au serveur de suivi...</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {typeof window !== "undefined" && localStorage.getItem("transen_active_trip_id") && (
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-4 mb-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold">Demande Allô Dakar en cours de suivi.</span>
              </div>
              <button
                onClick={() => {
                  const id = localStorage.getItem("transen_active_trip_id");
                  if (id) {
                    setActiveAlloDakarTripId(id);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Rejoindre le suivi
              </button>
            </div>
          )}

          {/* Service Tabs */}
          <div className="flex gap-1 bg-black/20 backdrop-blur rounded-2xl p-1 mb-5">
            {SERVICES.map(({ id, label, sub, Icon }) => (
              <button
                key={id}
                onClick={() => { setService(id); setResults(null); }}
                className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
                  service === id ? "bg-white shadow-lg" : "hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" style={{ color: service === id ? "var(--brand-green)" : "white" }} />
                <span className={`text-sm ${service === id ? "" : "text-white"}`} style={service === id ? { color: "var(--brand-green)" } : {}}>
                  {label}
                </span>
                <span className={`text-xs ${service === id ? "text-gray-400" : "text-white/50"}`}>{sub}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className={`grid gap-3 mb-4 ${service === "yobante" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
            {service !== "yobante" ? (
              <>
                <CityPicker label="Ville de départ" value={from} onChange={setFrom} exclude={to} />
                <CityPicker label="Destination" value={to} onChange={setTo} exclude={from} />
              </>
            ) : (
              <div>
                <p className="text-white/60 text-xs mb-1">Type de colis</p>
                <select className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark]">
                  <option>Standard ({"<"} 5 kg)</option>
                  <option>Large (5 – 20 kg)</option>
                  <option>Très large ({">"}20 kg)</option>
                </select>
              </div>
            )}

            {/* Date / Nom */}
            {service === "allo_dakar" ? (
              <div>
                <p className="text-white/60 text-xs mb-1">Votre Nom complet</p>
                <input
                  type="text"
                  placeholder="Ex: Babacar Diop"
                  value={passengerName}
                  onChange={e => setPassengerName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark] placeholder:text-white/30"
                />
              </div>
            ) : (
              <div>
                <p className="text-white/60 text-xs mb-1">Date de départ</p>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-9 pr-4 py-3 text-sm [color-scheme:dark]"
                  />
                </div>
              </div>
            )}

            {/* Seats / Téléphone */}
            {service === "allo_dakar" ? (
              <div>
                <p className="text-white/60 text-xs mb-1">Numéro de téléphone</p>
                <input
                  type="tel"
                  placeholder="Ex: 771234567"
                  value={passengerPhone}
                  onChange={e => setPassengerPhone(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark] placeholder:text-white/30"
                />
              </div>
            ) : (
              service !== "yobante" && (
                <div>
                  <p className="text-white/60 text-xs mb-1">Passagers</p>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    <select
                      value={seats}
                      onChange={e => setSeats(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-9 pr-4 py-3 text-sm [color-scheme:dark] appearance-none"
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n} place{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Search Button */}
          <motion.button
            onClick={handleSearch}
            whileTap={{ scale: 0.98 }}
            disabled={searching}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-xl disabled:opacity-80"
            style={{ backgroundColor: "var(--brand-gold)", color: "#111" }}
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                <span>{service === "allo_dakar" ? "Envoi de la demande..." : "Recherche en cours…"}</span>
              </>
            ) : (
              <>
                {service === "allo_dakar" ? (
                  <>
                    <Car className="w-5 h-5" />
                    <span>Demander un chauffeur Allô Dakar</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Rechercher les voyages</span>
                  </>
                )}
              </>
            )}
          </motion.button>
        </>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/80 text-sm">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
                {service !== "yobante" && from && to && <span className="text-white/50"> — {from} → {to}</span>}
              </p>
              <button onClick={() => setResults(null)} className="text-white/40 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            </div>
            {service === "bus_company" && (results as BusTrip[]).map(t => (
              <BusCard 
                key={t.id} 
                trip={t} 
                wantedSeats={seats} 
                onBookingSuccess={(ticket) => {
                  setActiveTicket({
                    ...ticket,
                    from: from || "Dakar",
                    to: to || "Kaolack",
                    date: date,
                    qrcode: `TS-QR-${Math.floor(100000 + Math.random() * 900000)}`
                  });
                }}
              />
            ))}
            {service === "allo_dakar" && (results as VtcRide[]).map(r => <VtcCard key={r.id} ride={r} />)}
            {service === "yobante" && (results as ColisOffer[]).map(o => <ColisCard key={o.id} offer={o} />)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎟️ LUXURY BOARDING PASS TICKET MODAL OVERLAY ─── */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
            >
              {/* Top luxury header */}
              <div className="bg-emerald-800 text-white p-6 pb-8 relative overflow-hidden">
                {/* Decorative absolute element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full translate-x-12 -translate-y-12" />
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">🇸🇳</span>
                    <span className="font-extrabold text-[#FFD700] tracking-wider text-xs font-mono uppercase">Carte d’accès TranSen</span>
                  </div>
                  <button 
                    onClick={() => setActiveTicket(null)}
                    className="p-1 px-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition text-[11px] font-bold"
                  >
                    Fermer
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div>
                    <span className="text-[10px] text-emerald-300 font-mono uppercase block tracking-wider">Provenance</span>
                    <span className="text-2xl font-extrabold text-white tracking-tight">{activeTicket.from}</span>
                  </div>
                  <div className="flex flex-col items-center px-4 self-center relative w-12 text-center h-full">
                    <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-[9px] text-[#FFD700] mt-0.5 bg-emerald-900 border border-emerald-700/50 px-1 rounded font-mono">1% Fee</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-300 font-mono uppercase block tracking-wider">Destination</span>
                    <span className="text-2xl font-extrabold text-white tracking-tight">{activeTicket.to}</span>
                  </div>
                </div>
              </div>

              {/* Tearing line with circular side punches */}
              <div className="relative h-1 bg-gray-50 flex items-center justify-between">
                <div className="absolute -left-3 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur" />
                <div className="w-full border-t border-dashed border-gray-300 mx-5" />
                <div className="absolute -right-3 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur" />
              </div>

              {/* Middle Section (Ticket Body) */}
              <div className="p-6 bg-white space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 font-mono">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Voyageur</span>
                    <span className="text-gray-800 font-bold block truncate">{activeTicket.passengerName} 🇸🇳</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Réseau / Transporteur</span>
                    <span className="text-gray-800 font-bold block truncate">{activeTicket.company}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Date de Départ</span>
                    <span className="text-gray-800 font-bold block truncate">{new Date(activeTicket.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Heure / Embarquement</span>
                    <span className="text-gray-800 font-bold block truncate">{activeTicket.dep}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Type de véhicule</span>
                    <span className="text-emerald-700 font-bold block truncate bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 self-start w-fit">{activeTicket.vehicle}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Places Assises</span>
                    <span className="text-gray-900 font-extrabold block text-sm">
                      {activeTicket.seats.length > 0 ? activeTicket.seats.map((s: number) => `#${s}`).join(", ") : "Libre / Non-Réservé"}
                    </span>
                  </div>
                </div>

                <div className="my-5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 font-mono text-[10px] block">Statut règlement :</span>
                    <span className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${activeTicket.routingType === "specific" ? "text-emerald-600" : "text-amber-600"}`}>
                      <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50 shrink-0" />
                      {activeTicket.routingType === "specific" ? "Réglé par SenePay (Wave/OM)" : "Paiement direct espèce (Gare)"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-[9px] block uppercase font-mono">Montant net</span>
                    <span className="text-lg font-extrabold text-emerald-800 font-mono">{activeTicket.totalCost.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Animated Scanner QR code area */}
                <div className="flex flex-col items-center justify-center pt-3 border-t border-gray-100 relative">
                  <div className="relative p-2 bg-slate-900 rounded-2xl border border-slate-800 w-32 h-32 flex items-center justify-center overflow-hidden">
                    {/* Animated laser scan beam */}
                    <motion.div 
                      animate={{
                        top: ["10%", "90%", "10%"]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute left-1.5 right-1.5 h-1 bg-red-500 shadow-[0_0_8px_#ef4444]"
                    />
                    
                    {/* Abstract QR design bars */}
                    <div className="text-3xl text-white select-none">📱🎟️</div>
                  </div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 mt-2">ID Réservation: {activeTicket.id}</span>
                </div>
              </div>

              {/* Utility Print / Save Bar */}
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => {
                    toast.success("🖨️ Préparation du document PDF... Votre billet est enregistré localement.");
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  📥 Télécharger (PDF)
                </button>
                <button
                  onClick={() => {
                    setActiveTicket(null);
                    toast.info("🎟️ Votre réservation a été ajoutée à votre portefeuille de voyages.");
                  }}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
