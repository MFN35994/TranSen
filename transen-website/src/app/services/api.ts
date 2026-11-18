/**
 * TranSen Core API Service Client
 * Production endpoint: https://api.transen.org (Spring Boot Backend)
 */

let apiBaseUrlOverride: string | null = null;
try {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("transen_api_url");
    if (stored && stored.trim().startsWith("http")) {
      apiBaseUrlOverride = stored.trim();
    } else if (stored !== null) {
      localStorage.removeItem("transen_api_url");
    }
  }
} catch {
  // Ignore storage errors in restricted browsing modes
}

const FALLBACK_ENV_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "https://api.transen.org";
let activeBaseUrl = apiBaseUrlOverride || FALLBACK_ENV_URL;

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  payload: unknown;
  response: unknown;
  isSimulated: boolean;
  status: number | "SUCCESS" | "FAILED";
}

export type ApiLogSubscriber = (logs: ApiLog[]) => void;
const subscribers = new Set<ApiLogSubscriber>();
let apiLogsList: ApiLog[] = [];

// ── Anti-Double-Click & Idempotency Guard ────────────────────────────────────
const inFlightMutations = new Set<string>();
const recentMutationTimestamps = new Map<string, number>();
const MUTATION_COOLDOWN_MS = 1500;

// ── GET Query Cache (15s TTL) ────────────────────────────────────────────────
const getCache = new Map<string, { timestamp: number; data: unknown }>();
const inFlightGets = new Map<string, Promise<unknown>>();
const GET_CACHE_TTL_MS = 15000;
const REQUEST_TIMEOUT_MS = 15000;

function computeMutationKey(method: string, path: string, bodyHash: string): string {
  return `${method}:${path}:${bodyHash}`;
}

function beginMutationGuard(method: string, path: string, bodyStr: string): { key: string; idempotencyKey: string } {
  const key = computeMutationKey(method, path, bodyStr.slice(0, 256));
  const now = Date.now();
  const last = recentMutationTimestamps.get(key);

  if (inFlightMutations.has(key) || (last !== undefined && now - last < MUTATION_COOLDOWN_MS)) {
    throw new Error("Requête déjà en cours de traitement. Veuillez patienter un instant.");
  }

  inFlightMutations.add(key);
  recentMutationTimestamps.set(key, now);
  return { key, idempotencyKey: `${now}-${Math.abs(hashString(key))}` };
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function subscribeToApiLogs(callback: ApiLogSubscriber) {
  subscribers.add(callback);
  callback([...apiLogsList]);
  return () => {
    subscribers.delete(callback);
  };
}

function addApiLog(log: Omit<ApiLog, "id" | "timestamp">) {
  const newLog: ApiLog = {
    ...log,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString("fr-FR"),
  };
  apiLogsList = [newLog, ...apiLogsList].slice(0, 40);
  subscribers.forEach((cb) => cb([...apiLogsList]));
}

export function getApiBaseUrl(): string {
  return activeBaseUrl;
}

export function setApiBaseUrl(url: string) {
  activeBaseUrl = url;
  getCache.clear();
  try {
    localStorage.setItem("transen_api_url", url);
  } catch {
    // Ignore storage errors
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Le serveur met trop de temps à répondre. Veuillez réessayer.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Helper HTTP fetch avec timeout, cache GET et protection anti-double-click + idempotency key.
 */
async function request<T>(path: string, options: RequestInit = {}, useCache = false): Promise<T> {
  const url = `${activeBaseUrl}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const isMutation = method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH";
  const bodyStr = typeof options.body === "string" ? options.body : "";

  if (method === "GET" && useCache) {
    const cached = getCache.get(path);
    if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
      return cached.data as T;
    }
    const existingFlight = inFlightGets.get(path);
    if (existingFlight) {
      return existingFlight as Promise<T>;
    }
  }

  let mutationGuard: { key: string; idempotencyKey: string } | null = null;
  if (isMutation) {
    mutationGuard = beginMutationGuard(method, path, bodyStr);
  }

  let bodyData: unknown = null;
  try {
    bodyData = bodyStr ? JSON.parse(bodyStr) : null;
  } catch {
    bodyData = null;
  }

  const execPromise = (async (): Promise<T> => {
    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(mutationGuard ? { "X-Idempotency-Key": mutationGuard.idempotencyKey } : {}),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erreur serveur");
        addApiLog({
          endpoint: path,
          method,
          payload: bodyData,
          response: { error: errorText },
          isSimulated: false,
          status: response.status,
        });
        throw new Error(errorText || `Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      addApiLog({
        endpoint: path,
        method,
        payload: bodyData,
        response: data,
        isSimulated: false,
        status: response.status,
      });

      if (method === "GET" && useCache) {
        getCache.set(path, { timestamp: Date.now(), data });
      }
      return data as T;
    } catch (error: any) {
      addApiLog({
        endpoint: path,
        method,
        payload: bodyData,
        response: { error: error?.message || "Network Error" },
        isSimulated: false,
        status: "FAILED",
      });
      throw error;
    } finally {
      if (mutationGuard) {
        inFlightMutations.delete(mutationGuard.key);
      }
      if (method === "GET") {
        inFlightGets.delete(path);
      }
    }
  })();

  if (method === "GET" && useCache) {
    inFlightGets.set(path, execPromise);
  }

  return execPromise;
}

// ==========================================
// 1. CONTACT FORM ENDPOINT
// ==========================================
export interface ContactPayload {
  nom: string;
  email: string;
  telephone: string;
  sujet: string;
  message: string;
}

export async function sendContactMessage(payload: ContactPayload): Promise<{ success: boolean; message: string }> {
  const backendPayload = {
    name: payload.nom,
    email: payload.email,
    phone: payload.telephone,
    profile: payload.sujet || "VISITEUR",
    message: payload.message,
  };

  return request<{ success: boolean; message: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(backendPayload),
  });
}

// ==========================================
// 2. CHAUFFEURS (DRIVER REGISTRATION)
// ==========================================
export interface ChauffeurPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  region: string;
  permisType: string;
  vehiculeType: string;
  description: string;
}

export async function registerChauffeur(payload: ChauffeurPayload): Promise<{ success: boolean; id: string }> {
  const contactPayload = {
    name: `${payload.prenom} ${payload.nom}`.trim(),
    email: payload.email,
    phone: payload.telephone,
    profile: "CHAUFFEUR",
    message: `Région: ${payload.region} | Permis/CNI: ${payload.permisType} | Véhicule: ${payload.vehiculeType}\nDescription: ${payload.description}`,
  };

  const res = await request<{ success: boolean; message: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(contactPayload),
  });

  return {
    success: res.success,
    id: `CH-${Math.floor(1000 + Math.random() * 9000)}`,
  };
}

// ==========================================
// 3. INVESTISSEURS (INVESTMENT PROMISE)
// ==========================================
export interface InvestisseurPayload {
  name: string;
  email: string;
  phone: string;
  amount: number;
  investorType: string;
  calculatedEquity: number;
}

export async function submitInvestmentFormData(formData: FormData): Promise<{ message: string; investment: any }> {
  const email = String(formData.get("email") || "");
  const phone = String(formData.get("phone") || "");
  const guard = beginMutationGuard("POST", "/api/investments", `${email}:${phone}`);

  try {
    const response = await fetchWithTimeout(`${activeBaseUrl}/api/investments`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "X-Idempotency-Key": guard.idempotencyKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erreur serveur");
      throw new Error(errorText || `Erreur (${response.status})`);
    }

    return response.json();
  } finally {
    inFlightMutations.delete(guard.key);
  }
}

// ==========================================
// 4. TRIPS & GARE ROUTIÈRE SYSTEM (Spring Boot /api/trips)
// ==========================================
export interface SpringBusTrip {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  relayPoint?: string;
  price: number;
  status: string;
  category: string;
  totalSeats: number;
  availableSeats: number;
  scheduledTime: string;
  companyId?: string;
  companyName?: string;
  driverId?: string;
  driverName?: string;
}

export interface Trip {
  id: string;
  compagnie: string;
  depart: string;
  arrivee: string;
  date: string;
  heure: string;
  prix: number;
  placesDispo: number;
  placesMax: number;
  type: "Bus" | "Minibus" | "Clando" | "Taxi 7 Places";
  statut: "Prévu" | "En embarquement" | "En route" | "Terminé" | "Annulé";
}

export async function searchTripsApi(departure: string, destination: string, date: string): Promise<SpringBusTrip[]> {
  const qs = new URLSearchParams({
    departure: departure.trim(),
    destination: destination.trim(),
    date,
  }).toString();
  return request<SpringBusTrip[]>(`/api/trips/search?${qs}`, { method: "GET" }, true);
}

export async function fetchTrips(): Promise<Trip[]> {
  const today = new Date().toISOString().split("T")[0];
  const raw = await searchTripsApi("", "", today);
  return raw.map((t) => ({
    id: t.id,
    compagnie: t.companyName || "Compagnie Partenaire",
    depart: t.pickupLocation,
    arrivee: t.dropoffLocation,
    date: t.scheduledTime ? t.scheduledTime.split("T")[0] : today,
    heure: t.scheduledTime ? t.scheduledTime.split("T")[1]?.slice(0, 5) || "08:00" : "08:00",
    prix: t.price || 0,
    placesDispo: t.availableSeats ?? 0,
    placesMax: t.totalSeats ?? 15,
    type: (t.totalSeats ?? 15) >= 30 ? "Bus" : "Minibus",
    statut: t.status === "IN_PROGRESS" ? "En route" : t.status === "COMPLETED" ? "Terminé" : "Prévu",
  }));
}

export async function getTripSeatMapApi(tripId: string): Promise<number[]> {
  const bookings = await request<Array<{ seatNumbers?: string; status?: string }>>(
    `/api/bookings/trip/${encodeURIComponent(tripId)}`,
    { method: "GET" },
    true
  );

  const occupied: number[] = [];
  for (const b of bookings || []) {
    if (b.status === "CANCELLED" || !b.seatNumbers) continue;
    const nums = b.seatNumbers
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    occupied.push(...nums);
  }
  return Array.from(new Set(occupied));
}

export async function calculateVtcEstimateApi(
  distanceKm: number,
  durationMinutes: number
): Promise<Array<{ vehicleClass: string; displayName: string; price: number }>> {
  const qs = new URLSearchParams({
    distanceKm: distanceKm.toString(),
    durationMinutes: durationMinutes.toString(),
  }).toString();
  return request<Array<{ vehicleClass: string; displayName: string; price: number }>>(
    `/api/vtc/calculate-price?${qs}`,
    { method: "GET" },
    true
  );
}

export async function requestAlloDakarTrip(payload: {
  passengerPhone: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  price: number;
}): Promise<any> {
  return request<any>("/api/trips/request", {
    method: "POST",
    body: JSON.stringify({
      passengerPhone: payload.passengerPhone,
      passengerName: payload.passengerName,
      pickupLocation: payload.pickupLocation,
      dropoffLocation: payload.dropoffLocation,
      price: payload.price,
      routingType: "INDEPENDENTS_ONLY",
      category: "ALLO_DAKAR",
      senderPhone: payload.passengerPhone,
    }),
  });
}

export async function requestYobanteApi(payload: {
  senderPhone: string;
  receiverPhone: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  baggageDescription: string;
  price: number;
}): Promise<any> {
  return request<any>("/api/trips/request", {
    method: "POST",
    body: JSON.stringify({
      passengerPhone: payload.senderPhone,
      passengerName: payload.passengerName,
      pickupLocation: payload.pickupLocation,
      dropoffLocation: payload.dropoffLocation,
      price: payload.price,
      routingType: "PUBLIC",
      category: "YOBANTE",
      senderPhone: payload.senderPhone,
      receiverPhone: payload.receiverPhone,
      baggageDescription: payload.baggageDescription,
    }),
  });
}

export async function getTripStatus(tripId: string): Promise<any> {
  return request<any>(`/api/trips/${encodeURIComponent(tripId)}`, {
    method: "GET",
  });
}

// ==========================================
// 5. BOOKINGS & SENEPAY CHECKOUT
// ==========================================
export interface Booking {
  id: string;
  tripId: string;
  passagerNom: string;
  passagerEmail: string;
  passagerPhone: string;
  siegeNumero: string;
  prixTTC: number;
  dateReservation: string;
  statutReglement: "Réglé" | "En attente" | "Remboursé";
  modePaiement: "Wave" | "Orange Money" | "Carte Bancaire" | "Espèces (Gare)";
}

export async function createBooking(payload: Omit<Booking, "id" | "dateReservation">): Promise<{
  id: string;
  boardingCode?: string;
  paymentReference?: string;
  dateReservation: string;
}> {
  const params = new URLSearchParams();
  params.append("tripId", payload.tripId);
  params.append("passengerPhone", payload.passagerPhone.trim());
  params.append("fullName", payload.passagerNom.trim());
  const seatsArray = payload.siegeNumero
    ? payload.siegeNumero.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const count = seatsArray.length > 0 ? seatsArray.length : 1;
  params.append("seats", count.toString());
  if (payload.siegeNumero) {
    params.append("seatNumbers", payload.siegeNumero);
  }

  const guard = beginMutationGuard("POST", "/api/bookings/manual-book", `${payload.tripId}:${payload.passagerPhone}:${payload.siegeNumero}`);
  try {
    const response = await fetchWithTimeout(`${activeBaseUrl}/api/bookings/manual-book?${params.toString()}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Idempotency-Key": guard.idempotencyKey,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Erreur lors de la réservation (${response.status})`);
    }

    const result = await response.json();
    // Invalider le cache des sièges pour refléter immédiatement la réservation
    getCache.delete(`/api/bookings/trip/${encodeURIComponent(payload.tripId)}`);

    return {
      id: result.id,
      boardingCode: result.boardingCode,
      paymentReference: result.paymentReference,
      dateReservation: result.createdAt || new Date().toISOString(),
    };
  } finally {
    inFlightMutations.delete(guard.key);
  }
}

export async function createSenePaySessionForBookingApi(params: {
  amount: number;
  orderId: string;
  description: string;
  customerPhone: string;
}): Promise<string | null> {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://transen.org";
  const data = await request<Record<string, any>>("/api/payments/create-session", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(params.amount),
      currency: "XOF",
      orderReference: params.orderId,
      description: params.description,
      successUrl: `${origin}/?payment=success&ref=${encodeURIComponent(params.orderId)}`,
      cancelUrl: `${origin}/?payment=cancel&ref=${encodeURIComponent(params.orderId)}`,
      webhookUrl: `${activeBaseUrl}/api/payments/webhook/senepay`,
      metadata: {
        order_id: params.orderId,
        platform: "web_site",
        phone: params.customerPhone,
      },
      expiresInMinutes: 60,
    }),
  });

  const url =
    data?.checkoutUrl ||
    data?.checkout_url ||
    data?.paymentUrl ||
    data?.payment_url ||
    data?.redirectUrl ||
    data?.redirect_url ||
    data?.url ||
    (data?.token ? `https://api.sene-pay.com/checkout?session=${data.token}` : null) ||
    (data?.sessionToken ? `https://api.sene-pay.com/checkout?session=${data.sessionToken}` : null);

  return typeof url === "string" ? url : null;
}

export async function cancelAlloDakarTrip(tripId: string): Promise<any> {
  return request<any>("/api/trips/save", {
    method: "POST",
    body: JSON.stringify({
      tripId,
      status: "CANCELLED",
    }),
  });
}
