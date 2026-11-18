import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Calendar, Users, Search, Bus, Car, Package,
  ChevronDown, Clock, ArrowRight, Star, CheckCircle, X, ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";
import {
  createBooking,
  searchTripsApi,
  getTripSeatMapApi,
  createSenePaySessionForBookingApi,
  requestAlloDakarTrip,
  requestYobanteApi,
  calculateVtcEstimateApi,
  getTripStatus,
  cancelAlloDakarTrip,
} from "../services/api";

const SENEGAL_CITIES = [
  "Dakar", "Thiès", "Touba", "Kaolack", "Saint-Louis", "Ziguinchor",
  "Tambacounda", "Louga", "Kolda", "Diourbel", "Fatick", "Kaffrine",
  "Sédhiou", "Matam", "Mbour", "Rufisque", "Pikine", "Guédiawaye"
];

type ServiceType = "bus_company" | "allo_dakar" | "yobante";

const SERVICES: { id: ServiceType; label: string; sub: string; Icon: typeof Bus }[] = [
  { id: "bus_company", label: "Compagnies", sub: "Bus · Horaires fixes", Icon: Bus },
  { id: "allo_dakar", label: "Allô Dakar", sub: "VTC · Départ immédiat", Icon: Car },
  { id: "yobante", label: "Yobanté", sub: "Colis · Interurbain", Icon: Package },
];

const YOBANTE_PACKAGES = [
  { id: "standard", label: "Standard (< 5 kg)", price: 2500, delay: "Même jour · Assurance incluse" },
  { id: "large", label: "Large (5 – 20 kg)", price: 4500, delay: "Même jour · Assurance incluse" },
  { id: "express", label: "Express Prioritaire (> 20 kg)", price: 7000, delay: "Livraison prioritaire · Suivi GPS" },
];

interface BusTrip {
  id: string;
  company: string;
  dep: string;
  arr: string;
  available: number;
  total: number;
  price: number;
  vehicle: string;
  relayPoint?: string;
  rating: number;
}

/* ─── City Dropdown with Search Filter ──────────────────────────────── */
function CityPicker({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const cities = SENEGAL_CITIES.filter(
    (c) => c !== exclude && c.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div className="relative">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setQuery("");
        }}
        className="w-full flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl px-4 py-3 text-left hover:bg-white/15 transition-all cursor-pointer"
      >
        <MapPin className="w-4 h-4 text-white/50 shrink-0" />
        <span className="flex-1 truncate text-sm">
          {value || <span className="text-white/40">{label}</span>}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 right-0 bg-[#071a12]/90 backdrop-blur-xl rounded-xl shadow-2xl z-50 border border-white/10 overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                autoFocus
                placeholder="Filtrer une ville..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-slate-100 bg-white/[0.04] rounded-lg border border-white/15 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {cities.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">Aucune ville trouvée</p>
              ) : (
                cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      onChange(city);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-emerald-500/150/15 hover:text-emerald-300 transition-colors text-sm cursor-pointer"
                  >
                    {city}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Seat Map ──────────────────────────────────────────────────────── */
function SeatBtn({
  n,
  occupied,
  selected,
  onClick,
}: {
  n: number;
  occupied: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={occupied}
      title={occupied ? "Occupé" : `Siège ${n}`}
      className={`w-9 h-9 rounded-lg text-xs transition-all border-2 ${
        occupied
          ? "bg-blue-50 border-slate-700 text-blue-300 cursor-not-allowed"
          : selected
          ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-slate-950 font-bold"
          : "bg-emerald-500/15 border-green-300 text-emerald-300 hover:border-green-500 hover:bg-emerald-500/25 cursor-pointer"
      }`}
    >
      {n}
    </button>
  );
}

function SeatMap({
  total,
  occupied,
  selected,
  loading,
  onToggle,
}: {
  total: number;
  occupied: number[];
  selected: number[];
  loading?: boolean;
  onToggle: (n: number) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10 h-[240px] flex flex-col justify-center gap-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2 justify-center">
            <div className="w-9 h-9 rounded-lg bg-white/10" />
            <div className="w-9 h-9 rounded-lg bg-white/10" />
            <div className="w-5" />
            <div className="w-9 h-9 rounded-lg bg-white/10" />
            <div className="w-9 h-9 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  const isLargeBus = total > 15;
  const cols = isLargeBus ? 4 : 3;
  const rows = Math.ceil(total / cols);

  return (
    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/10 max-h-[300px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
          Avant du véhicule
        </span>
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">
          🚐
        </div>
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: rows }).map((_, r) => {
          const s1 = r * cols + 1;
          const s2 = r * cols + 2;
          const s3 = r * cols + 3;
          const s4 = r * cols + 4;
          return (
            <div key={r} className="flex gap-1.5 items-center justify-center">
              {s1 <= total && (
                <SeatBtn n={s1} occupied={occupied.includes(s1)} selected={selected.includes(s1)} onClick={() => onToggle(s1)} />
              )}
              {s2 <= total && (
                <SeatBtn n={s2} occupied={occupied.includes(s2)} selected={selected.includes(s2)} onClick={() => onToggle(s2)} />
              )}
              <div className="w-5 text-center text-[9px] text-gray-300 font-mono">Allée</div>
              {s3 <= total && (
                <SeatBtn n={s3} occupied={occupied.includes(s3)} selected={selected.includes(s3)} onClick={() => onToggle(s3)} />
              )}
              {isLargeBus && s4 <= total && (
                <SeatBtn n={s4} occupied={occupied.includes(s4)} selected={selected.includes(s4)} onClick={() => onToggle(s4)} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/10 justify-center text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-green-300 inline-block" /> Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-slate-700 inline-block" /> Occupé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[var(--brand-gold)] inline-block" /> Sélectionné
        </span>
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
    boardingCode?: string;
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
  const [occupied, setOccupied] = useState<number[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [routingType, setRoutingType] = useState<"specific" | "public">("specific");

  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger le plan réel des sièges occupés depuis Spring Boot (/api/bookings/trip/{id})
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingSeats(true);
    getTripSeatMapApi(trip.id)
      .then((seats) => {
        if (active) setOccupied(seats);
      })
      .catch(() => {
        // En cas de fallback hors-ligne, déduire au plus juste
        if (active) {
          const count = Math.max(0, trip.total - trip.available);
          setOccupied(Array.from({ length: count }, (_, i) => i + 1));
        }
      })
      .finally(() => {
        if (active) setLoadingSeats(false);
      });
    return () => {
      active = false;
    };
  }, [open, trip.id, trip.total, trip.available]);

  const toggle = (n: number) => {
    if (occupied.includes(n)) return;
    setSelected((s) =>
      s.includes(n) ? s.filter((x) => x !== n) : s.length < wantedSeats ? [...s, n] : s
    );
  };

  const calculateTotalCost = () => trip.price * wantedSeats;

  const book = async () => {
    if (isSubmitting) return;
    if (selected.length < wantedSeats) {
      toast.info(`Sélectionnez d'abord vos ${wantedSeats} siège(s).`);
      setOpen(true);
      return;
    }

    if (!passengerName.trim() || !passengerEmail.trim() || !passengerPhone.trim()) {
      toast.info("Veuillez remplir vos coordonnées passager pour la réservation.");
      setOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const priceNum = calculateTotalCost();
      const transenComm = Math.round((priceNum * 2) / 100); // Commission unique TranSen : 2%
      void transenComm;

      const bookingResult = await createBooking({
        tripId: trip.id,
        passagerNom: passengerName.trim(),
        passagerEmail: passengerEmail.trim(),
        passagerPhone: passengerPhone.trim(),
        siegeNumero: selected.join(", "),
        prixTTC: priceNum,
        statutReglement: routingType === "specific" ? "Réglé" : "En attente",
        modePaiement: routingType === "specific" ? "Wave" : "Espèces (Gare)",
      });

      if (routingType === "specific") {
        const orderRef = bookingResult.paymentReference || `WEB-BUS-${bookingResult.id}`;
        try {
          const checkoutUrl = await createSenePaySessionForBookingApi({
            amount: priceNum,
            orderId: orderRef,
            description: `Billet ${trip.company} (${selected.length} place(s))`,
            customerPhone: passengerPhone.trim(),
          });
          if (checkoutUrl) {
            toast.success("Redirection vers SenePay pour finaliser le paiement...");
            window.open(checkoutUrl, "_blank", "noopener,noreferrer");
          }
        } catch {
          // Billet créé en attente : le passager obtient son billet avec code d'embarquement
        }
      }

      if (onBookingSuccess) {
        onBookingSuccess({
          id: bookingResult.id,
          boardingCode: bookingResult.boardingCode,
          company: trip.company,
          vehicle: trip.vehicle,
          dep: trip.dep,
          arr: trip.arr,
          seats: selected,
          totalCost: priceNum,
          routingType,
          passengerName: passengerName.trim(),
          passengerEmail: passengerEmail.trim(),
          passengerPhone: passengerPhone.trim(),
          dateReservation: bookingResult.dateReservation,
        });
      }

      toast.success(
        routingType === "specific"
          ? `🎟️ Réservation confirmée (${priceNum.toLocaleString("fr-FR")} FCFA) · Commission plateforme 2%.`
          : `🎟️ Place(s) réservée(s) ! Règlement en espèces de ${priceNum.toLocaleString("fr-FR")} FCFA à l'embarquement.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création de la réservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div layout className="bg-[#071a12]/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-md border border-white/10">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-bold truncate">{trip.company}</span>
            <span className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: "var(--brand-gold)" }}>
              <Star className="w-3 h-3 fill-[var(--brand-gold)]" />
              {trip.rating}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-200">{trip.dep}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-semibold text-slate-200">{trip.arr}</span>
            <span className="text-gray-300">·</span>
            <span className="bg-emerald-500/15 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-emerald-100">
              {trip.vehicle}
            </span>
            {trip.relayPoint && (
              <span className="text-[10px] text-gray-400 truncate">📍 {trip.relayPoint}</span>
            )}
          </div>
          <div className="flex gap-0.5 mt-3">
            {Array.from({ length: Math.min(trip.total, 60) }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i < trip.available ? "bg-green-400" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold" style={{ color: "var(--brand-green)" }}>
            {trip.price.toLocaleString("fr-FR")} <span className="text-xs text-gray-400">FCFA</span>
          </div>
          <div className={`text-xs mt-0.5 font-medium ${trip.available <= 3 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {trip.available} place{trip.available > 1 ? "s" : ""} dispo
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2 bg-[#061510]/85 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 py-2 rounded-xl border text-sm font-semibold transition-all hover:bg-white/[0.06] cursor-pointer"
          style={{ borderColor: "var(--brand-green)", color: "var(--brand-green)" }}
        >
          {open ? "Masquer les détails" : "Sélectionner mes places"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={book}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "radial-gradient(circle at 20% 15%, #073826 0%, #03150e 55%, #020908 100%)", borderTop: "1px solid rgba(52,211,153,0.18)", borderBottom: "1px solid rgba(52,211,153,0.18)" }}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Validation...
            </>
          ) : routingType === "specific" ? (
            "Réserver · SenePay"
          ) : (
            "Réserver · Espèces"
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-[#071a12]/90 backdrop-blur-xl"
          >
            <div className="p-4 grid md:grid-cols-12 gap-5">
              <div className="md:col-span-6">
                <p className="text-xs text-slate-300 mb-2 font-medium">
                  Sélectionnez vos places ({selected.length}/{wantedSeats})
                </p>
                <SeatMap
                  total={trip.total}
                  occupied={occupied}
                  selected={selected}
                  loading={loadingSeats}
                  onToggle={toggle}
                />
              </div>

              <div className="md:col-span-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-medium uppercase font-mono">Informations Passager</p>
                  <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      placeholder="Nom complet du passager *"
                      required
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="w-full bg-[#071a12]/90 backdrop-blur-xl border border-white/15 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Email *"
                        required
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        className="w-full bg-[#071a12]/90 backdrop-blur-xl border border-white/15 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Téléphone *"
                        required
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                        className="w-full bg-[#071a12]/90 backdrop-blur-xl border border-white/15 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-2 font-medium uppercase font-mono">Option de Routage & Paiement</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setRoutingType("specific")}
                      className={`p-2.5 text-xs rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        routingType === "specific"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-950 font-semibold"
                          : "bg-[#071a12]/90 backdrop-blur-xl border-white/15 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span>Demande Spécifique</span>
                      <span className="text-[9px] leading-tight font-normal">Paiement d'avance via SenePay. 98% à la compagnie.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutingType("public")}
                      className={`p-2.5 text-xs rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        routingType === "public"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-950 font-semibold"
                          : "bg-[#071a12]/90 backdrop-blur-xl border-white/15 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span>Demande Publique</span>
                      <span className="text-[9px] leading-tight font-normal">Envoi global. Paiement obligatoire espèces à bord.</span>
                    </button>
                  </div>

                  <div className="bg-white/[0.04] p-3 rounded-xl border border-white/10 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tarif unitaire :</span>
                      <span className="font-bold text-slate-100">{trip.price.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Places choisies :</span>
                      <span className="font-bold text-slate-100">{selected.length || wantedSeats} place(s)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-white/15 text-white font-bold">
                      <span>Total à payer :</span>
                      <span style={{ color: "var(--brand-green)" }}>{calculateTotalCost().toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={book}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow hover:opacity-90 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: "radial-gradient(circle at 20% 15%, #073826 0%, #03150e 55%, #020908 100%)", borderTop: "1px solid rgba(52,211,153,0.18)", borderBottom: "1px solid rgba(52,211,153,0.18)" }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirmation en cours...
                      </>
                    ) : routingType === "specific" ? (
                      `Régler ${calculateTotalCost().toLocaleString("fr-FR")} FCFA par SenePay`
                    ) : (
                      "S'enregistrer (Payer en Espèces à bord)"
                    )}
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

/* ─── Search Skeleton ────────────────────────────────────────────────── */
function ResultsSkeleton() {
  return (
    <div className="mt-5 space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="bg-[#071a12]/95 rounded-2xl p-4 shadow-md animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1 pr-4">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-3 w-56 bg-white/[0.06] rounded" />
            </div>
            <div className="h-6 w-24 bg-emerald-100 rounded" />
          </div>
          <div className="h-2 w-full bg-white/[0.06] rounded-full mt-3" />
        </div>
      ))}
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
  const [results, setResults] = useState<BusTrip[] | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [packageType, setPackageType] = useState("standard");
  const [vtcEstimate, setVtcEstimate] = useState<number>(4500);

  const [activeAlloDakarTripId, setActiveAlloDakarTripId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("transen_active_trip_id");
    }
    return null;
  });
  const [trackedTrip, setTrackedTrip] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Estimation tarif VTC via Spring Boot (/api/vtc/calculate-price)
  useEffect(() => {
    if (service !== "allo_dakar" || !from || !to || from === to) return;
    calculateVtcEstimateApi(18, 25)
      .then((list) => {
        if (Array.isArray(list) && list.length > 0 && typeof list[0].price === "number") {
          setVtcEstimate(list[0].price);
        }
      })
      .catch(() => {
        setVtcEstimate(4500);
      });
  }, [service, from, to]);

  useEffect(() => {
    if (activeAlloDakarTripId) {
      localStorage.setItem("transen_active_trip_id", activeAlloDakarTripId);
    }
  }, [activeAlloDakarTripId]);

  useEffect(() => {
    if (!activeAlloDakarTripId) return;

    const pollTrip = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      getTripStatus(activeAlloDakarTripId)
        .then((trip) => {
          setTrackedTrip(trip);
          if (trip && (trip.status === "COMPLETED" || trip.status === "CANCELLED")) {
            localStorage.removeItem("transen_active_trip_id");
          }
        })
        .catch(() => {});
    };

    pollTrip();
    const intervalId = setInterval(pollTrip, 4500);
    return () => clearInterval(intervalId);
  }, [activeAlloDakarTripId]);

  const handleSwapCities = () => {
    const prevFrom = from;
    setFrom(to);
    setTo(prevFrom);
  };

  const handleCancelTrip = async () => {
    if (!activeAlloDakarTripId || cancelling) return;
    if (!window.confirm("Êtes-vous sûr de vouloir annuler votre demande de trajet ? Cette action est irréversible.")) {
      return;
    }
    setCancelling(true);
    try {
      await cancelAlloDakarTrip(activeAlloDakarTripId);
      toast.success("Votre demande de trajet a été annulée.");
      setTrackedTrip((prev: any) => (prev ? { ...prev, status: "CANCELLED" } : null));
      localStorage.removeItem("transen_active_trip_id");
      setTimeout(() => {
        setActiveAlloDakarTripId(null);
        setTrackedTrip(null);
      }, 2000);
    } catch (err: any) {
      toast.error(err?.message || "Impossible d'annuler le trajet.");
    } finally {
      setCancelling(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSearch = async () => {
    if (searching) return;

    if (!from || !to) {
      toast.error("Veuillez choisir une ville de départ et de destination.");
      return;
    }
    if (from === to) {
      toast.error("Départ et destination doivent être différents.");
      return;
    }

    setSearching(true);
    setResults(null);

    try {
      if (service === "bus_company") {
        const apiTrips = await searchTripsApi(from, to, date);

        if (!apiTrips || apiTrips.length === 0) {
          toast.info(
            `Aucune compagnie disponible de ${from} vers ${to} le ${new Date(date).toLocaleDateString("fr-FR")}.`
          );
          setResults([]);
        } else {
          setResults(
            apiTrips.map((apiTrip) => {
              let depTime = "08:00";
              if (apiTrip.scheduledTime && apiTrip.scheduledTime.includes("T")) {
                depTime = apiTrip.scheduledTime.split("T")[1].slice(0, 5);
              }
              const [h, m] = depTime.split(":").map(Number);
              const arrHour = ((Number.isNaN(h) ? 8 : h) + 3) % 24;
              const arrMin = ((Number.isNaN(m) ? 0 : m) + 30) % 60;
              const formattedArr = `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`;
              const seatsTotal = apiTrip.totalSeats || 15;

              return {
                id: apiTrip.id,
                company: apiTrip.companyName || "Compagnie Partenaire",
                dep: depTime,
                arr: formattedArr,
                available: apiTrip.availableSeats ?? seatsTotal,
                total: seatsTotal,
                price: apiTrip.price || 5000,
                vehicle: seatsTotal >= 30 ? `Grand Bus ${seatsTotal} places` : `Minibus ${seatsTotal} places`,
                relayPoint: apiTrip.relayPoint || undefined,
                rating: 4.9,
              };
            })
          );
        }
      } else if (service === "allo_dakar") {
        if (!passengerName.trim() || !passengerPhone.trim()) {
          toast.error("Veuillez renseigner votre nom et votre numéro de téléphone.");
          return;
        }

        const trip = await requestAlloDakarTrip({
          passengerPhone: passengerPhone.trim(),
          passengerName: passengerName.trim(),
          pickupLocation: from,
          dropoffLocation: to,
          price: vtcEstimate,
        });

        if (trip && trip.id) {
          setActiveAlloDakarTripId(trip.id);
          toast.success("Demande Allô Dakar envoyée aux chauffeurs en ligne !");
        } else {
          throw new Error("Impossible d'obtenir l'identifiant du trajet créé.");
        }
      } else {
        // Yobanté réel sur Spring Boot /api/trips/request
        if (!passengerName.trim() || !passengerPhone.trim() || !receiverPhone.trim()) {
          toast.error("Veuillez renseigner votre nom, votre numéro et celui du destinataire.");
          return;
        }
        const pkg = YOBANTE_PACKAGES.find((p) => p.id === packageType) || YOBANTE_PACKAGES[0];
        const parcelTrip = await requestYobanteApi({
          senderPhone: passengerPhone.trim(),
          receiverPhone: receiverPhone.trim(),
          passengerName: passengerName.trim(),
          pickupLocation: from,
          dropoffLocation: to,
          baggageDescription: `${pkg.label} (${from} ➔ ${to})`,
          price: pkg.price,
        });

        if (parcelTrip && parcelTrip.id) {
          setActiveAlloDakarTripId(parcelTrip.id);
          toast.success(`📦 Expédition Yobanté créée (${pkg.price.toLocaleString("fr-FR")} FCFA) ! Suivi actif.`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la connexion au serveur.");
      if (service === "bus_company") setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full">
      {activeAlloDakarTripId ? (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white mb-4">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{service === "yobante" ? "📦" : "🚗"}</span>
              <span className="font-extrabold text-[#FFD700] tracking-wider text-xs font-mono uppercase">
                Suivi en direct TranSen
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAlloDakarTripId(null);
                setTrackedTrip(null);
                toast.info("Suivi fermé.");
              }}
              className="p-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition text-xs font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase block tracking-wider">Départ</span>
              <span className="text-xl font-bold text-white">{trackedTrip?.pickupLocation || from || "Dakar"}</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-5 h-5 text-[#FFD700] animate-pulse" />
              <span className="text-[9px] text-[#FFD700] mt-0.5 font-mono">En ligne</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-mono uppercase block tracking-wider">Destination</span>
              <span className="text-xl font-bold text-white">{trackedTrip?.dropoffLocation || to || "Thiès"}</span>
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
                      <span className="text-sm font-bold text-[#FFD700]">Recherche d'un chauffeur en cours...</span>
                    </>
                  )}
                  {trackedTrip.status === "ACCEPTED" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold text-emerald-400">Acceptée par un chauffeur !</span>
                    </>
                  )}
                  {trackedTrip.status === "IN_PROGRESS" && (
                    <>
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-sm font-bold text-blue-400">En cours d'acheminement...</span>
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
                      <span className="text-sm font-bold text-red-500">Demande annulée.</span>
                    </>
                  )}
                </div>
              </div>

              {(trackedTrip.status === "ACCEPTED" || trackedTrip.status === "IN_PROGRESS" || trackedTrip.status === "COMPLETED") && (
                <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-mono uppercase">Votre Chauffeur</span>
                    <span className="text-base font-bold block">{trackedTrip.driverName || "Chauffeur TranSen"}</span>
                  </div>
                  {trackedTrip.driverPhone && (
                    <a
                      href={`tel:${trackedTrip.driverPhone}`}
                      className="bg-emerald-600 hover:bg-emerald-500/150/150 text-white px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      📞 {trackedTrip.driverPhone}
                    </a>
                  )}
                </div>
              )}

              {(trackedTrip.status === "PENDING" || trackedTrip.status === "ACCEPTED" || trackedTrip.status === "IN_PROGRESS") && (
                <button
                  type="button"
                  onClick={handleCancelTrip}
                  disabled={cancelling}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? "Annulation en cours..." : "🚫 Annuler ma demande"}
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
          {/* Service Tabs */}
          <div className="flex gap-1.5 bg-[#03100b]/80 border border-white/10 backdrop-blur-xl rounded-2xl p-1.5 mb-5">
            {SERVICES.map(({ id, label, sub, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setService(id);
                  setResults(null);
                }}
                className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all cursor-pointer ${
                  service === id
                    ? "bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/20 border border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.28)]"
                    : "border border-transparent hover:bg-white/5"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${service === id ? "text-emerald-300" : "text-slate-300"}`} />
                <span
                  className={`text-sm font-bold ${service === id ? "text-white" : "text-slate-200"}`}
                >
                  {label}
                </span>
                <span className={`text-[11px] ${service === id ? "text-emerald-200/80" : "text-white/50"}`}>{sub}</span>
              </button>
            ))}
          </div>

          {/* City Pickers + Quick Swap */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 items-end">
            <div className="sm:col-span-5">
              <CityPicker label="Ville de départ" value={from} onChange={setFrom} exclude={to} />
            </div>
            <div className="hidden sm:flex sm:col-span-2 justify-center pb-1">
              <button
                type="button"
                onClick={handleSwapCities}
                title="Inverser départ et destination"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 transition cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="sm:col-span-5">
              <CityPicker label="Destination" value={to} onChange={setTo} exclude={from} />
            </div>
          </div>

          {/* Service-specific fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {service === "bus_company" && (
              <>
                <div>
                  <p className="text-white/60 text-xs mb-1">Date de départ</p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    <input
                      type="date"
                      value={date}
                      min={today}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-9 pr-4 py-3 text-sm [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Passagers</p>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                    <select
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-9 pr-4 py-3 text-sm [color-scheme:dark] appearance-none"
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n} place{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {service === "allo_dakar" && (
              <>
                <div>
                  <p className="text-white/60 text-xs mb-1">Votre Nom complet</p>
                  <input
                    type="text"
                    placeholder="Ex: Babacar Diop"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30"
                  />
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Téléphone (Tarif estimé ~{vtcEstimate.toLocaleString("fr-FR")} F)</p>
                  <input
                    type="tel"
                    placeholder="Ex: 771234567"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30"
                  />
                </div>
              </>
            )}

            {service === "yobante" && (
              <>
                <div>
                  <p className="text-white/60 text-xs mb-1">Format du colis</p>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm [color-scheme:dark]"
                  >
                    {YOBANTE_PACKAGES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} — {p.price.toLocaleString("fr-FR")} F
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Nom de l'expéditeur</p>
                  <input
                    type="text"
                    placeholder="Ex: Awa Ndiaye"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30"
                  />
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Tél. Expéditeur</p>
                  <input
                    type="tel"
                    placeholder="77 123 45 67"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30"
                  />
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Tél. Destinataire</p>
                  <input
                    type="tel"
                    placeholder="78 987 65 43"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30"
                  />
                </div>
              </>
            )}
          </div>

          <motion.button
            type="button"
            onClick={handleSearch}
            whileTap={{ scale: 0.98 }}
            disabled={searching}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all hover:shadow-xl disabled:opacity-70 cursor-pointer"
            style={{ backgroundColor: "var(--brand-gold)", color: "#111" }}
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                <span>{service === "bus_company" ? "Recherche en cours…" : "Envoi en cours..."}</span>
              </>
            ) : service === "allo_dakar" ? (
              <>
                <Car className="w-5 h-5" />
                <span>Demander un chauffeur Allô Dakar</span>
              </>
            ) : service === "yobante" ? (
              <>
                <Package className="w-5 h-5" />
                <span>Expédier mon colis Yobanté</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Rechercher les voyages</span>
              </>
            )}
          </motion.button>
        </>
      )}

      {searching && service === "bus_company" && <ResultsSkeleton />}

      <AnimatePresence>
        {results && !searching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/80 text-sm">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
                {from && to && <span className="text-white/50"> — {from} → {to}</span>}
              </p>
              <button type="button" onClick={() => setResults(null)} className="text-white/40 hover:text-white/70 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {results.map((t) => (
              <BusCard
                key={t.id}
                trip={t}
                wantedSeats={seats}
                onBookingSuccess={(ticket) => {
                  setActiveTicket({
                    ...ticket,
                    from: from || "Dakar",
                    to: to || "Kaolack",
                    date,
                    qrcode: ticket.boardingCode || `TS-${ticket.id.slice(0, 6).toUpperCase()}`,
                  });
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boarding Pass Ticket Modal */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-md bg-[#071a12]/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            >
              <div className="bg-emerald-800 text-white p-6 pb-8 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">🇸🇳</span>
                    <span className="font-extrabold text-[#FFD700] tracking-wider text-xs font-mono uppercase">Carte d’accès TranSen</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="p-1 px-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition text-[11px] font-bold cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div>
                    <span className="text-[10px] text-emerald-300 font-mono uppercase block tracking-wider">Provenance</span>
                    <span className="text-2xl font-extrabold text-white tracking-tight">{activeTicket.from}</span>
                  </div>
                  <div className="flex flex-col items-center px-4 self-center text-center">
                    <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-[9px] text-[#FFD700] mt-0.5 bg-emerald-900 border border-emerald-700/50 px-1 rounded font-mono">2% Fee</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-300 font-mono uppercase block tracking-wider">Destination</span>
                    <span className="text-2xl font-extrabold text-white tracking-tight">{activeTicket.to}</span>
                  </div>
                </div>
              </div>

              <div className="relative h-1 bg-white/[0.04] flex items-center justify-between">
                <div className="absolute -left-3 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur" />
                <div className="w-full border-t border-dashed border-white/20 mx-5" />
                <div className="absolute -right-3 w-6 h-6 rounded-full bg-slate-950/80 backdrop-blur" />
              </div>

              <div className="p-6 bg-[#071a12]/90 backdrop-blur-xl space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 font-mono">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Voyageur</span>
                    <span className="text-slate-100 font-bold block truncate">{activeTicket.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Transporteur</span>
                    <span className="text-slate-100 font-bold block truncate">{activeTicket.company}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Date de Départ</span>
                    <span className="text-slate-100 font-bold block truncate">
                      {new Date(activeTicket.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Heure</span>
                    <span className="text-slate-100 font-bold block truncate">{activeTicket.dep}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Places Assises</span>
                    <span className="text-white font-extrabold block text-sm">
                      {activeTicket.seats.map((s: number) => `#${s}`).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Code Embarquement</span>
                    <span className="text-emerald-700 font-black block text-sm">{activeTicket.qrcode}</span>
                  </div>
                </div>

                <div className="my-4 p-3.5 bg-white/[0.04] rounded-2xl border border-white/15/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] block">Statut règlement :</span>
                    <span className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${activeTicket.routingType === "specific" ? "text-emerald-600" : "text-amber-600"}`}>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {activeTicket.routingType === "specific" ? "SenePay (Wave/OM)" : "Espèces à bord"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-[9px] block uppercase font-mono">Total</span>
                    <span className="text-lg font-extrabold text-emerald-800 font-mono">{activeTicket.totalCost.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.04] p-4 border-t border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500/150/150 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  🖨️ Imprimer / Sauver (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-3 bg-white/10 hover:bg-gray-300 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
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
