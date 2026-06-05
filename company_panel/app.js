import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Configuration Firebase (transen-pro)
const firebaseConfig = {
    apiKey: "AIzaSyBI9aic0z55HA8AT31In3fbHUJy-AQ4qq4",
    appId: "1:552529206563:web:db7af28ae9b752e203c096",
    messagingSenderId: "552529206563",
    projectId: "transen-pro",
    authDomain: "transen-pro.firebaseapp.com",
    storageBucket: "transen-pro.firebasestorage.app",
    measurementId: "G-3RZNWXB756"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "transen");

const API_BASE_URL = 'https://api.transen.org'; // The Spring Boot backend

let currentCompanyId = null;
let currentToken = null;

// Initialiser l'état au chargement
window.onload = () => {
    const token = localStorage.getItem('transen_company_token');
    const companyId = localStorage.getItem('transen_company_id');
    if (token && companyId && companyId !== 'undefined' && companyId !== 'null') {
        currentToken = token;
        currentCompanyId = companyId;
        const companyName = localStorage.getItem('transen_company_name');
        const companyCode = localStorage.getItem('transen_company_code');
        showApp({ name: companyName, companyCode: companyCode });
    } else {
        hideApp();
    }
};

// Interface Tabs: Login vs Register
document.getElementById('showRegisterBtn').onclick = () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
};

document.getElementById('showLoginBtn').onclick = () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
};

// --- Inscription ---
document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    btn.innerHTML = 'Création en cours...'; btn.disabled = true;

    const data = {
        firstName: document.getElementById('regFirstName').value,
        lastName: document.getElementById('regLastName').value,
        companyName: document.getElementById('regCompanyName').value,
        phone: document.getElementById('regPhone').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        type: 'ALLO_DAKAR' // ou GARAGE, etc.
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/company/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('transen_company_token', result.token);
            localStorage.setItem('transen_company_id', result.companyId);
            localStorage.setItem('transen_company_name', data.companyName);
            // In the backend, we don't return the code directly on register in the DTO currently, but we will mock it or fetch it later.
            alert("Compte créé avec succès ! Bienvenue.");
            window.location.reload();
        } else {
            alert("Erreur: " + result.message);
        }
    } catch (error) {
        alert("Erreur de connexion au serveur.");
    } finally {
        btn.innerHTML = 'Créer mon compte'; btn.disabled = false;
    }
};

// --- Connexion ---
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signInBtn');
    btn.innerHTML = 'Connexion...'; btn.disabled = true;

    const data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/company/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            if (!result.companyId) {
                alert("Votre compte n'est pas encore rattaché à une compagnie valide. Contactez l'administrateur.");
                btn.innerHTML = 'Se connecter'; btn.disabled = false;
                return;
            }
            localStorage.setItem('transen_company_token', result.token);
            localStorage.setItem('transen_company_id', result.companyId);
            localStorage.setItem('transen_company_name', result.companyName);
            localStorage.setItem('transen_company_code', result.companyCode);
            window.location.reload();
        } else {
            alert("Erreur: " + result.message);
        }
    } catch (error) {
        alert("Erreur de connexion au serveur.");
    } finally {
        btn.innerHTML = 'Se connecter'; btn.disabled = false;
    }
};

// Fonctions d'Affichage Principales
function showApp(companyData) {
    document.getElementById('login-overlay').style.display = "none";
    document.getElementById('admin-app').style.display = "flex";
    
    document.getElementById('companyName').innerText = companyData.name || "Compagnie";
    document.getElementById('adminInitial').innerText = (companyData.name || "C").charAt(0).toUpperCase();
    document.getElementById('companyCodeDisplay').innerText = companyData.companyCode || "------";
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('fr-FR', options);

    setupNavigation();
    loadDashboardData();
}

function hideApp() {
    document.getElementById('login-overlay').style.display = "flex";
    document.getElementById('admin-app').style.display = "none";
}

document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location.reload();
};

function setupNavigation() {
    document.querySelectorAll('#mainNav a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            document.querySelectorAll('.admin-section').forEach(s => {
                s.classList.remove('active-section');
                s.style.display = 'none';
            });
            const target = document.getElementById(`section-${section}`);
            if (target) {
                target.style.display = 'block';
                // Trigger reflow to animate
                target.offsetHeight;
                target.classList.add('active-section');
            }
            document.querySelectorAll('#mainNav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('sectionTitle').innerText = link.innerText;

            if (section === 'kyc') {
                loadKycData();
            } else if (section === 'profile') {
                loadProfileData();
            }
        };
    });
}

// ==========================================
// SenePay Wallet Logic
// ==========================================
let currentSenepayAction = null; // 'deposit' or 'withdraw'

document.getElementById('depositBtn').onclick = () => {
    currentSenepayAction = 'deposit';
    document.getElementById('senepayModalTitle').innerText = "Déposer des fonds (SenePay)";
    document.getElementById('senepayOperatorGroup').style.display = "none";
    document.getElementById('senepayModal').style.display = "flex";
};

document.getElementById('withdrawBtn').onclick = () => {
    currentSenepayAction = 'withdraw';
    document.getElementById('senepayModalTitle').innerText = "Retirer vers Mobile Money";
    document.getElementById('senepayOperatorGroup').style.display = "block";
    document.getElementById('senepayModal').style.display = "flex";
};

document.getElementById('cancelSenepayBtn').onclick = () => {
    document.getElementById('senepayModal').style.display = "none";
    document.getElementById('senepayAmount').value = "";
    document.getElementById('senepayPhone').value = "";
};

document.getElementById('confirmSenepayBtn').onclick = async () => {
    const amountStr = document.getElementById('senepayAmount').value;
    const phone = document.getElementById('senepayPhone').value;
    
    if (!amountStr || !phone) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const amount = parseFloat(amountStr);
    const operator = document.getElementById('senepayOperator').value;
    const btn = document.getElementById('confirmSenepayBtn');
    btn.innerHTML = "Traitement..."; btn.disabled = true;

    try {
        const url = `${API_BASE_URL}/api/company/dashboard/wallet/${currentSenepayAction}?companyId=${currentCompanyId}`;
        const requestBody = { amount: amount, phone: phone };
        if (currentSenepayAction === 'withdraw') {
            requestBody.operator = operator;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        
        if (response.ok) {
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                alert(result.message + "\nRéférence: " + (result.reference || "N/A"));
                document.getElementById('cancelSenepayBtn').click();
                loadDashboardData(); // Refresh wallet data
            }
        } else {
            alert("Erreur: " + (result.message || "Action refusée"));
        }
    } catch (error) {
        alert("Erreur réseau avec le serveur SenePay.");
    } finally {
        btn.innerHTML = "Confirmer"; btn.disabled = false;
    }
};

// ==========================================
// Receipt Modal Logic
// ==========================================
window.openReceipt = function(ref, date, type, status, amountStr) {
    let statusFr = status;
    if (status === 'PENDING') statusFr = 'EN ATTENTE';
    if (status === 'COMPLETED') statusFr = 'COMPLÉTÉ';
    if (status === 'FAILED') statusFr = 'ÉCHOUÉ';

    document.getElementById('receiptRef').innerText = ref;
    document.getElementById('receiptDate').innerText = date;
    document.getElementById('receiptType').innerText = type;
    document.getElementById('receiptStatus').innerText = statusFr;
    document.getElementById('receiptStatus').className = `receipt-val status-tag ${status.toLowerCase()}`;
    document.getElementById('receiptAmount').innerText = amountStr;
    
    document.getElementById('receiptModal').style.display = "flex";
};

document.getElementById('closeReceiptBtn').onclick = () => {
    document.getElementById('receiptModal').style.display = "none";
};

document.getElementById('shareReceiptBtn').onclick = async () => {
    const receiptElement = document.getElementById('receiptContent');
    const btn = document.getElementById('shareReceiptBtn');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
        btn.disabled = true;
        
        // Use html2canvas to capture the receipt element
        const canvas = await html2canvas(receiptElement, {
            scale: 2, // Higher resolution
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#0f1322'
        });
        
        // Convert to data URL
        const image = canvas.toDataURL("image/png");
        
        // Create a download link
        const link = document.createElement('a');
        link.href = image;
        const ref = document.getElementById('receiptRef').innerText;
        link.download = `Transen_Recu_${ref}.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error("Erreur lors de la génération du reçu:", error);
        alert("Impossible de générer le reçu.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// ==========================================
// API CALLS (Spring Boot)
// ==========================================

async function fetchWithAuth(url) {
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        }
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        hideApp();
        throw new Error("Unauthorized");
    }
    return response.json();
}

async function loadDashboardData() {
    if (!currentCompanyId) return;

    try {
        // 0. Load KYC Status
        try {
            const kycStatus = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);
            const banner = document.getElementById('kycAlertBanner');
            if (banner) {
                if (kycStatus.status !== 'APPROVED') {
                    banner.style.display = 'block';
                    if (kycStatus.status === 'REJECTED') {
                        banner.querySelector('p').innerText = `Votre dossier a été refusé pour la raison suivante : ${kycStatus.rejectionReason || "Documents non conformes"}. Veuillez le corriger dans la rubrique Dossier KYC.`;
                        banner.querySelector('h4').innerText = "Dossier KYC Rejeté";
                        banner.style.borderColor = "var(--red)";
                        banner.querySelector('i').style.color = "var(--red)";
                        banner.querySelector('h4').style.color = "var(--red)";
                    } else if (kycStatus.status === 'PENDING') {
                        banner.querySelector('p').innerText = "Vos documents de vérification sont en cours de validation par notre équipe. Vous serez notifié dès qu'ils seront approuvés.";
                        banner.querySelector('h4').innerText = "Vérification en cours";
                        banner.style.borderColor = "var(--gold)";
                        banner.querySelector('i').style.color = "var(--gold)";
                        banner.querySelector('h4').style.color = "var(--gold)";
                    }
                } else {
                    banner.style.display = 'none';
                }
            }
        } catch (kycErr) {
            console.error("Erreur lors de la récupération du statut KYC :", kycErr);
        }

        // 1. Load Stats
        const stats = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/stats?companyId=${currentCompanyId}`);
        document.getElementById('activeDriversCount').innerText = `${stats.activeDrivers} / ${stats.totalDrivers}`;
        document.getElementById('onlineDriversCount').innerText = stats.activeDrivers;
        document.getElementById('offlineDriversCount').innerText = stats.totalDrivers - stats.activeDrivers;
        document.getElementById('todayTrips').innerText = stats.todayTrips;
        document.getElementById('totalRevenue').innerText = `${stats.totalRevenue.toLocaleString()} F`;

        // 2. Load Drivers
        const drivers = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/drivers?companyId=${currentCompanyId}`);
        const driversTbody = document.getElementById('driversTableBody');
        const dashboardDriverList = document.getElementById('dashboardDriverList');
        
        driversTbody.innerHTML = "";
        if (dashboardDriverList) dashboardDriverList.innerHTML = "";

        if (drivers.length === 0) {
            driversTbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Aucun chauffeur. Donnez votre Code de Recrutement !</td></tr>`;
            if (dashboardDriverList) dashboardDriverList.innerHTML = `<div class="loading-cell" style="text-align:center; padding:20px; color:var(--text-dim);">Aucun chauffeur rattaché.</div>`;
        } else {
            drivers.forEach((d, index) => {
                driversTbody.innerHTML += `
                    <tr>
                        <td><b>${d.name}</b></td>
                        <td>${d.phone}</td>
                        <td>Véhicule Enregistré</td>
                        <td>${d.totalTrips}</td>
                        <td><b>${d.totalRevenue.toLocaleString()} F</b></td>
                        <td><span class="status-tag ${d.status === 'ACTIVE' ? 'active' : 'inactive'}">${d.status}</span></td>
                        <td><button class="icon-btn glass" style="color:var(--text-dim)"><i class="fas fa-ban"></i></button></td>
                    </tr>`;
                
                if (dashboardDriverList && index < 6) {
                    let badgeClass = d.status === 'ACTIVE' ? 'available' : 'maintenance';
                    let statusText = d.status === 'ACTIVE' ? 'En Ligne' : 'Hors Ligne';
                    dashboardDriverList.innerHTML += `
                    <div class="driver-status-item">
                        <div class="driver-info-sm">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random" alt="${d.name}">
                            <div><span class="d-name">${d.name}</span><span class="d-car">${d.phone}</span></div>
                        </div>
                        <span class="status-badge ${badgeClass}">${statusText}</span>
                    </div>`;
                }
            });
        }

        // Initialize Mapbox with active drivers
        setupMapbox(drivers);

        // 3. Load Trips
        const trips = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/trips?companyId=${currentCompanyId}`);
        const liveTbody = document.getElementById('liveTripsTableBody');
        const dashTbody = document.getElementById('activityTableBody');
        liveTbody.innerHTML = ""; dashTbody.innerHTML = "";
        
        if (trips.length === 0) {
            liveTbody.innerHTML = `<tr><td colspan="6" class="loading-cell">Aucune course enregistrée.</td></tr>`;
            dashTbody.innerHTML = `<tr><td colspan="5" class="loading-cell">Aucune activité.</td></tr>`;
        } else {
            trips.forEach((t, index) => {
                const dateStr = new Date(t.createdAt).toLocaleString('fr-FR');
                liveTbody.innerHTML += `
                    <tr>
                        <td><small>${t.id.substring(0,6)}</small><br>${dateStr}</td>
                        <td><b>${t.driverName}</b></td>
                        <td>${t.clientName}</td>
                        <td><small><b>De:</b> ${t.departure}<br><b>À:</b> ${t.destination}</small></td>
                        <td><b>${t.price} F</b></td>
                        <td><span class="status-tag ${t.status.toLowerCase()}">${t.status}</span></td>
                        <td>
                            <button class="btn-primary" onclick="window.openPassengerManager('${t.id}', '${t.departure} ➔ ${t.destination}')" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px;">
                                <i class="fas fa-users"></i> Gérer
                            </button>
                        </td>
                    </tr>`;
                    
                if (index < 8) {
                    dashTbody.innerHTML += `
                    <tr>
                        <td>${dateStr}</td>
                        <td>${t.driverName}</td>
                        <td>Classique</td>
                        <td><b>${t.price} F</b></td>
                        <td><span class="status-tag ${t.status.toLowerCase()}">${t.status}</span></td>
                    </tr>`;
                }
            });
        }

        // 4. Load Wallet Data
        const walletData = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/wallet?companyId=${currentCompanyId}`);
        document.getElementById('walletBalance').innerText = `${walletData.balance.toLocaleString()} F`;
        
        const txTbody = document.getElementById('transactionsTableBody');
        txTbody.innerHTML = "";
        if (walletData.transactions.length === 0) {
            txTbody.innerHTML = `<tr><td colspan="4" class="loading-cell">Aucune transaction pour le moment.</td></tr>`;
        } else {
            walletData.transactions.forEach(tx => {
                const dateStr = new Date(tx.date).toLocaleString('fr-FR');
                let color = "var(--text-color)";
                let amountStr = `${tx.amount} F`;
                if (tx.amount > 0) { color = "var(--green)"; amountStr = `+${tx.amount} F`; }
                else if (tx.amount < 0) { color = "var(--red)"; }
                
                let ref = tx.id ? tx.id.substring(0, 8).toUpperCase() : "N/A";
                let statusFr = tx.status;
                if (statusFr === 'PENDING') statusFr = 'EN ATTENTE';
                if (statusFr === 'COMPLETED') statusFr = 'COMPLÉTÉ';
                if (statusFr === 'FAILED') statusFr = 'ÉCHOUÉ';
                
                txTbody.innerHTML += `
                    <tr style="cursor: pointer;" onclick="openReceipt('${ref}', '${dateStr}', '${tx.type}', '${tx.status}', '${amountStr}')" title="Cliquez pour voir le reçu">
                        <td>${dateStr}</td>
                        <td><b>${tx.type}</b></td>
                        <td style="color: ${color}; font-weight: bold;">${amountStr}</td>
                        <td><span class="status-tag ${tx.status.toLowerCase()}">${statusFr}</span></td>
                    </tr>`;
            });
        }

    } catch (error) {
        console.error("Erreur chargement données API", error);
    }
}

let map;
let markers = {}; // Store markers by driverId

function setupMapbox(drivers) {
    if (!document.getElementById('fleetMap')) return;
    
    // Dakar Center
    const dakarCenter = [-17.4677, 14.7167];

    if (!map) {
        mapboxgl.accessToken = 'pk.eyJ1IjoidHJhbnNlbiIsImEiOiJjbXA4Nm5menUwM205MnNwOGZmb3N3ZTM4In0.SMFaXkbJJi5bM6Bk3_p8ng';
        map = new mapboxgl.Map({
            container: 'fleetMap',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: dakarCenter,
            zoom: 12
        });
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    // Subscribe to Firestore for real-time driver locations
    const activeDriversRef = collection(db, "active_drivers");
    
    onSnapshot(activeDriversRef, (snapshot) => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const driverId = doc.id;
            
            // Check if this driver belongs to our company (is in our drivers array)
            const isOurDriver = drivers.find(d => d.id === driverId);
            
            if (isOurDriver && data.status === 'online') {
                const lng = data.lng;
                const lat = data.lat;

                if (markers[driverId]) {
                    // Update existing marker position smoothly
                    markers[driverId].setLngLat([lng, lat]);
                } else {
                    // Create new marker
                    const el = document.createElement('div');
                    el.className = 'driver-marker';
                    el.style.width = '18px';
                    el.style.height = '18px';
                    el.style.backgroundColor = 'var(--primary)';
                    el.style.border = '3px solid white';
                    el.style.borderRadius = '50%';
                    el.style.boxShadow = '0 0 15px var(--primary-glow)';
                    el.style.cursor = 'pointer';
                    el.style.transition = 'all 0.3s ease'; // Smooth movement

                    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
                        <div style="color: #333; padding: 5px; font-family: 'Outfit', sans-serif;">
                            <h4 style="margin:0 0 4px 0; font-size: 14px;">${isOurDriver.name}</h4>
                            <p style="margin:0; font-size: 12px; color: #666;">Statut: En Ligne</p>
                        </div>
                    `);

                    const marker = new mapboxgl.Marker(el)
                        .setLngLat([lng, lat])
                        .setPopup(popup)
                        .addTo(map);
                        
                    markers[driverId] = marker;
                }
            } else if (markers[driverId]) {
                // If driver goes offline or leaves, remove marker
                markers[driverId].remove();
                delete markers[driverId];
            }
        });
    }, (error) => {
        console.error("Erreur Firestore temps réel:", error);
    });
}

// ==========================================
// PASSENGER MANAGER LOGIC (B2B Busses / Minibusses)
// ==========================================
let currentPassengerTripId = null;

window.openPassengerManager = async function(tripId, route) {
    currentPassengerTripId = tripId;
    document.getElementById('pmTripRoute').innerText = route;
    document.getElementById('passengerModal').style.display = "flex";
    await loadTripBookings();
};

document.getElementById('closePassengerModalBtn').onclick = () => {
    document.getElementById('passengerModal').style.display = "none";
    currentPassengerTripId = null;
};

async function loadTripBookings() {
    if (!currentPassengerTripId) return;
    const listBody = document.getElementById('pmPassengersList');
    listBody.innerHTML = `<tr><td colspan="5" class="loading-cell" style="text-align:center;">Chargement...</td></tr>`;

    try {
        const bookings = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/trips/${currentPassengerTripId}/bookings`);
        listBody.innerHTML = "";
        
        if (bookings.length === 0) {
            listBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: var(--text-dim);">Aucun passager sur ce trajet.</td></tr>`;
        } else {
            bookings.forEach(b => {
                let payStatusText = b.paymentStatus === 'PAID_IN_ADVANCE' ? 'PAYÉ D\'AVANCE' : 'ESPÈCES';
                let payBadgeClass = b.paymentStatus === 'PAID_IN_ADVANCE' ? 'status-COMPLETED' : 'status-PENDING';
                let boardText = b.status === 'BOARDED' ? 'À Bord' : (b.status === 'CANCELLED' ? 'Annulé' : 'Réservé');
                let boardBadgeClass = b.status === 'BOARDED' ? 'status-COMPLETED' : (b.status === 'CANCELLED' ? 'status-FAILED' : 'status-PENDING');
                
                listBody.innerHTML += `
                    <tr>
                        <td style="padding: 10px;"><b>${b.passengerName}</b><br><small>${b.passengerPhone}</small></td>
                        <td style="padding: 10px; text-align: center;">${b.seatsBooked}</td>
                        <td style="padding: 10px;"><span class="status-tag ${payBadgeClass}" style="padding: 2px 8px; font-size: 0.7rem;">${payStatusText}</span></td>
                        <td style="padding: 10px;"><small>${b.boardingCode}</small><br><span class="status-tag ${boardBadgeClass}" style="padding: 2px 8px; font-size: 0.7rem;">${boardText}</span></td>
                        <td style="padding: 10px;">
                            ${b.status !== 'CANCELLED' ? `
                            <button class="icon-btn" onclick="window.revokePassenger('${b.id}', '${b.passengerPhone}')" style="background: none; border: none; color: var(--red); cursor: pointer;" title="Révoquer le passager">
                                <i class="fas fa-user-minus"></i>
                            </button>` : `<span style="color:var(--text-dim);">Annulé</span>`}
                        </td>
                    </tr>`;
            });
        }
    } catch (error) {
        listBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: var(--red);">Erreur lors du chargement.</td></tr>`;
    }
}

window.revokePassenger = async function(bookingId, passengerId) {
    if (!confirm("Voulez-vous vraiment révoquer ce passager de ce trajet ?")) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Tenter la désinscription sur Firestore en temps réel
            try {
                const tripRef = doc(db, "pools", currentPassengerTripId);
                await updateDoc(tripRef, {
                    passengerIds: arrayRemove(passengerId),
                    [`passengerDetails.${passengerId}`]: deleteField()
                });
            } catch(e) {
                try {
                    const tripRef = doc(db, "trips", currentPassengerTripId);
                    await updateDoc(tripRef, {
                        passengerIds: arrayRemove(passengerId),
                        [`passengerDetails.${passengerId}`]: deleteField()
                    });
                } catch(err) {
                    console.log("Désinscription Firestore ignorée :", err);
                }
            }

            alert("Passager révoqué avec succès !");
            await loadTripBookings();
            loadDashboardData(); // Refresh seats / stats
        } else {
            const err = await response.text();
            alert("Erreur: " + err);
        }
    } catch (error) {
        alert("Erreur de connexion lors de la révocation.");
    }
};

document.getElementById('pmAddPassengerForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!currentPassengerTripId) return;

    const name = document.getElementById('pmPassengerName').value;
    const phone = document.getElementById('pmPassengerPhone').value;
    const seats = document.getElementById('pmPassengerSeats').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/manual-book?tripId=${currentPassengerTripId}&passengerPhone=${encodeURIComponent(phone)}&fullName=${encodeURIComponent(name)}&seats=${seats}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            // Tenter l'inscription sur Firestore en temps réel pour avertir le chauffeur
            try {
                const tripRef = doc(db, "pools", currentPassengerTripId);
                await updateDoc(tripRef, {
                    passengerIds: arrayUnion(phone),
                    [`passengerDetails.${phone}`]: {
                        fullName: name,
                        phone: phone,
                        seats: parseInt(seats)
                    }
                });
            } catch(e) {
                try {
                    const tripRef = doc(db, "trips", currentPassengerTripId);
                    await updateDoc(tripRef, {
                        passengerIds: arrayUnion(phone),
                        [`passengerDetails.${phone}`]: {
                            fullName: name,
                            phone: phone,
                            seats: parseInt(seats)
                        }
                    });
                } catch(err) {
                    console.log("Inscription Firestore ignorée :", err);
                }
            }

            alert("Passager ajouté avec succès !");
            document.getElementById('pmPassengerName').value = "";
            document.getElementById('pmPassengerPhone').value = "";
            document.getElementById('pmPassengerSeats').value = "1";
            await loadTripBookings();
            loadDashboardData(); // Refresh
        } else {
            const err = await response.text();
            alert("Erreur: " + err);
        }
    } catch (error) {
        alert("Erreur de connexion.");
    }
};

// ==========================================
// KYC Documents Upload Logic
// ==========================================
window.loadKycData = async function() {
    if (!currentCompanyId) return;

    const statusText = document.getElementById('kycStatusText');
    const rejectionReason = document.getElementById('kycRejectionReason');
    const statusCard = document.getElementById('kycStatusCard');

    try {
        const kyc = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);
        
        // Update Status Presentation
        if (kyc.status === 'APPROVED') {
            statusText.innerText = "DOSSIER APPROUVÉ (CONFORME)";
            statusText.style.color = "var(--green)";
            statusCard.style.background = "rgba(46, 204, 113, 0.15)";
            statusCard.style.borderColor = "var(--green)";
            rejectionReason.style.display = "none";
        } else if (kyc.status === 'REJECTED') {
            statusText.innerText = "DOSSIER REFUSÉ / REJETÉ";
            statusText.style.color = "var(--red)";
            statusCard.style.background = "rgba(231, 76, 60, 0.15)";
            statusCard.style.borderColor = "var(--red)";
            rejectionReason.innerText = `Motif du rejet : ${kyc.rejectionReason || "Documents non conformes"}`;
            rejectionReason.style.display = "block";
        } else if (kyc.status === 'PENDING') {
            statusText.innerText = "DOSSIER EN COURS D'EXAMEN";
            statusText.style.color = "var(--gold)";
            statusCard.style.background = "rgba(243, 156, 18, 0.15)";
            statusCard.style.borderColor = "var(--gold)";
            rejectionReason.style.display = "none";
        } else {
            statusText.innerText = "EN ATTENTE DE SOUMISSION";
            statusText.style.color = "var(--text-dim)";
            statusCard.style.background = "rgba(255, 255, 255, 0.03)";
            statusCard.style.borderColor = "var(--glass-border)";
            rejectionReason.style.display = "none";
        }

        // Show Links to current files if they exist
        const showLink = (elementId, url) => {
            const link = document.getElementById(elementId);
            if (url) {
                link.href = url;
                link.style.display = "inline-block";
            } else {
                link.style.display = "none";
            }
        };

        showLink('rccmLink', kyc.rccmFileUrl);
        showLink('nineaLink', kyc.nineaFileUrl);
        showLink('idFrontLink', kyc.managerIdFrontUrl);
        showLink('idBackLink', kyc.managerIdBackUrl);
        showLink('authLink', kyc.transportAuthUrl);

    } catch (e) {
        console.error("Erreur lors de la récupération du KYC :", e);
    }
};

document.getElementById('kycUploadForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    const btn = document.getElementById('submitKycBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi des fichiers...';
    btn.disabled = true;

    const formData = new FormData();
    const rccmFile = document.getElementById('kycRccm').files[0];
    const nineaFile = document.getElementById('kycNinea').files[0];
    const idFront = document.getElementById('kycIdFront').files[0];
    const idBack = document.getElementById('kycIdBack').files[0];
    const authFile = document.getElementById('kycAuth').files[0];

    if (rccmFile) formData.append('rccmFile', rccmFile);
    if (nineaFile) formData.append('nineaFile', nineaFile);
    if (idFront) formData.append('idCardFront', idFront);
    if (idBack) formData.append('idCardBack', idBack);
    if (authFile) formData.append('transportAuth', authFile);

    try {
        const response = await fetch(`${API_BASE_URL}/api/companies/${currentCompanyId}/kyc`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (response.ok) {
            alert("Documents KYC soumis avec succès ! Notre équipe va procéder à la vérification.");
            // Reset files inputs
            document.getElementById('kycRccm').value = "";
            document.getElementById('kycNinea').value = "";
            document.getElementById('kycIdFront').value = "";
            document.getElementById('kycIdBack').value = "";
            document.getElementById('kycAuth').value = "";
            
            await loadKycData();
            loadDashboardData();
        } else {
            const err = await response.text();
            let errText = err;
            try {
                const errJson = JSON.parse(err);
                errText = errJson.message || errJson.error || err;
            } catch (e) {}
            
            if (errText.includes("MaxUploadSizeExceeded") || errText.includes("size exceeded") || response.status === 413) {
                alert("Erreur : Un ou plusieurs fichiers sont trop volumineux. La taille maximale autorisée est de 50 Mo par fichier. Veuillez compresser vos documents PDF ou vos images avant de les envoyer.");
            } else {
                alert("Erreur lors de la soumission : " + (errText.length > 250 ? errText.substring(0, 250) + "..." : errText));
            }
        }
    } catch (err) {
        alert("Erreur réseau ou fichier trop volumineux : " + err.message);
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
};

// ==========================================
// User Profile Logic
// ==========================================
window.loadProfileData = async function() {
    if (!currentCompanyId) return;

    try {
        // Fetch User details
        const user = await fetchWithAuth(`${API_BASE_URL}/api/users/me`);
        
        // Fetch Company/KYC details
        const company = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);

        // Populate User elements
        document.getElementById('profileManagerName').innerText = user.fullName || "Gérant";
        document.getElementById('profileEmail').innerText = user.email || "Non renseigné";
        document.getElementById('profilePhone').innerText = user.phone || "Non renseigné";

        // Set Avatar initials
        if (user.fullName) {
            document.getElementById('profileAvatar').innerText = user.fullName.charAt(0).toUpperCase();
        }

        // Populate Company elements
        document.getElementById('profileCompanyName').innerText = user.companyName || company.name || "Compagnie";
        document.getElementById('profileCompanyType').innerText = `Type: ${company.type || "Non spécifié"}`;
        document.getElementById('profileAccessCode').innerText = company.accessCode || "------";

        // Style and populate KYC status
        const kycStatusText = document.getElementById('profileKycStatus');
        if (company.status === 'APPROVED') {
            kycStatusText.innerText = "APPROUVÉ";
            kycStatusText.style.color = "var(--green)";
        } else if (company.status === 'REJECTED') {
            kycStatusText.innerText = "REJETÉ";
            kycStatusText.style.color = "var(--red)";
        } else if (company.status === 'PENDING') {
            kycStatusText.innerText = "EN ATTENTE";
            kycStatusText.style.color = "var(--gold)";
        } else {
            kycStatusText.innerText = "NON SOUMIS";
            kycStatusText.style.color = "var(--text-dim)";
        }

    } catch (e) {
        console.error("Erreur lors du chargement du profil :", e);
    }
};
