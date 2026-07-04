/**
 * TranSen Core API Service Client
 * Prepared for Spring Boot Backend integration.
 * 
 * To connect your Spring Boot backend:
 * 1. Set the VITE_API_BASE_URL prefix in your environment, e.g. VITE_API_BASE_URL=http://localhost:8080
 * 2. Implement matching Spring Boot REST Controllers annotated with @RestController and @CrossOrigin.
 * 
 * Fallback Mode: IF there is no API URL configured, the services will act with local mock persistence,
 * allowing full frontend preview testing while logging payload schemas.
 */

// Retrieve initially configured URL or fall back
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
} catch (e) {}

const FALLBACK_ENV_URL = (import.meta.env.VITE_API_BASE_URL as string) || "https://transen-backend.onrender.com";
let activeBaseUrl = apiBaseUrlOverride ? apiBaseUrlOverride : FALLBACK_ENV_URL;

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  payload: any;
  response: any;
  isSimulated: boolean;
  status: number | "SUCCESS" | "FAILED";
}

export type ApiLogSubscriber = (logs: ApiLog[]) => void;
const subscribers = new Set<ApiLogSubscriber>();
let apiLogsList: ApiLog[] = [];

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
  apiLogsList = [newLog, ...apiLogsList].slice(0, 40); // keep last 40 logs
  subscribers.forEach((cb) => cb([...apiLogsList]));
}

export function getApiBaseUrl(): string {
  return activeBaseUrl;
}

export function setApiBaseUrl(url: string) {
  activeBaseUrl = url;
  try {
    localStorage.setItem("transen_api_url", url);
  } catch (e) {}
}

/**
 * Helper to easily make HTTP fetch calls to Spring Boot
 */
async function request<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${activeBaseUrl}${path}`;
  const method = options.method || "GET";
  const bodyData = options.body ? JSON.parse(options.body as string) : null;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      addApiLog({
        endpoint: path,
        method,
        payload: bodyData,
        response: { error: errorText },
        isSimulated: false,
        status: response.status,
      });
      throw new Error(`API Error (${response.status}): ${errorText}`);
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
    return data as T;
  } catch (error: any) {
    if (!options.headers) { // Only log once if it's the top level
      addApiLog({
        endpoint: path,
        method,
        payload: bodyData,
        response: { error: error.message || "Network Error" },
        isSimulated: false,
        status: "FAILED",
      });
    }
    throw error;
  }
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

/**
 * Submits the contact support form.
 * 
 * Spring Boot integration guide:
 * @PostMapping("/api/contact")
 * public ResponseEntity<Map<String, String>> submitContact(@RequestBody ContactPayload payload) { ... }
 */
export async function sendContactMessage(payload: ContactPayload): Promise<{ success: boolean; message: string }> {
  console.log("[API Request] Sending contact message to Spring Boot:", payload);
  
  const backendPayload = {
    name: payload.nom,
    email: payload.email,
    phone: payload.telephone,
    profile: payload.sujet || "VISITEUR",
    message: payload.message
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

/**
 * Submits a new driver partner application.
 * 
 * Spring Boot integration guide:
 * @PostMapping("/api/chauffeurs")
 * public ResponseEntity<Map<String, Object>> applyDriver(@Valid @RequestBody ChauffeurPayload payload) { ... }
 */
export async function registerChauffeur(payload: ChauffeurPayload): Promise<{ success: boolean; id: string }> {
  console.log("[API Request] Registering driver partner via Contact endpoint in Spring Boot:", payload);
  
  const contactPayload = {
    name: `${payload.prenom} ${payload.nom}`,
    email: payload.email,
    phone: payload.telephone,
    profile: "CHAUFFEUR",
    message: `Région: ${payload.region} | Permis: ${payload.permisType} | Véhicule: ${payload.vehiculeType}\nDescription: ${payload.description}`
  };
  
  const res = await request<{ success: boolean; message: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(contactPayload),
  });

  return {
    success: res.success,
    id: `CH-${Math.floor(1000 + Math.random() * 9000)}`
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
  console.log("[API Request] Submitting investment promise to Spring Boot...");
  const url = `${activeBaseUrl}/api/investments`;
  
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ==========================================
// 4. TRIPS & GARE ROUTIÈRE SYSTEM
// ==========================================
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

/**
 * Fetches all available trips.
 * 
 * Spring Boot integration guide:
 * @GetMapping("/api/trips")
 * public List<Trip> getAllTrips() { ... }
 */
export async function fetchTrips(): Promise<Trip[]> {
  console.log("[API Request] Fetching all trips from Spring Boot...");
  return request<Trip[]>("/api/trips", {
    method: "GET",
  });
}

/**
 * Creates a new trip.
 * 
 * Spring Boot integration guide:
 * @PostMapping("/api/trips")
 * public Trip createTrip(@RequestBody Trip newTrip) { ... }
 */
export async function createTrip(payload: Omit<Trip, "id">): Promise<Trip> {
  console.log("[API Request] Creating a new trip on Spring Boot:", payload);
  return request<Trip>("/api/trips", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 5. BOOKINGS & PASSENGER TICKETS
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

/**
 * Recherche des trajets de compagnies de bus réels.
 */
export async function searchTripsApi(departure: string, destination: string, date: string): Promise<any[]> {
  console.log(`[API Request] Searching company trips from ${departure} to ${destination} on ${date}...`);
  return request<any[]>(`/api/trips/search?departure=${encodeURIComponent(departure)}&destination=${encodeURIComponent(destination)}&date=${date}`, {
    method: "GET"
  });
}

/**
 * Envoie une demande de trajet Allo Dakar (VTC) pour recherche de chauffeur en temps réel.
 */
export async function requestAlloDakarTrip(payload: {
  passengerPhone: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  price: number;
}): Promise<any> {
  console.log("[API Request] Submitting Allo Dakar request to Spring Boot:", payload);
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
      senderPhone: payload.passengerPhone
    })
  });
}

/**
 * Récupère le statut d'un trajet par son ID (pour le live tracking).
 */
export async function getTripStatus(tripId: string): Promise<any> {
  return request<any>(`/api/trips/${tripId}`, {
    method: "GET"
  });
}

/**
 * Books a ticket for a trip via Spring Boot manual-book endpoint.
 */
export async function createBooking(payload: Omit<Booking, "id" | "dateReservation">): Promise<any> {
  console.log("[API Request] Creating ticket booking via manual-book:", payload);
  const params = new URLSearchParams();
  params.append("tripId", payload.tripId);
  params.append("passengerPhone", payload.passagerPhone);
  params.append("fullName", payload.passagerNom);
  const seatsArray = payload.siegeNumero ? payload.siegeNumero.split(",").map(s => s.trim()).filter(Boolean) : [];
  const count = seatsArray.length > 0 ? seatsArray.length : 1;
  params.append("seats", count.toString());
  if (payload.siegeNumero) {
    params.append("seatNumbers", payload.siegeNumero);
  }

  const url = `${activeBaseUrl}/api/bookings/manual-book?${params.toString()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erreur lors de la réservation (${response.status})`);
  }

  const result = await response.json();
  return {
    id: result.id,
    dateReservation: result.createdAt || new Date().toISOString()
  };
}

export async function cancelAlloDakarTrip(tripId: string): Promise<any> {
  console.log("[API Request] Cancelling Allo Dakar trip:", tripId);
  const response = await fetch(`${activeBaseUrl}/api/trips/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      tripId: tripId,
      status: "CANCELLED"
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}
