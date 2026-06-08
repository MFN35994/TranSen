import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, getDocs, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBI9aic0z55HA8AT31In3fbHUJy-AQ4qq4",
    appId: "1:552529206563:web:db7af28ae9b752e203c096",
    messagingSenderId: "552529206563",
    projectId: "transen-pro",
    authDomain: "transen-pro.firebaseapp.com",
    storageBucket: "transen-pro.firebasestorage.app"
};

console.log("Initializing Firebase App...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use named database 'transen'
console.log("Connecting to Firestore (database: transen)...");
const db = getFirestore(app, "transen");

initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LeEVuEsAAAAAOA8c4-WJ2v8j-BCi5w1MSthhExg'),
    isTokenAutoRefreshEnabled: true
});

const API_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8081' 
    : 'https://api.transen.org';

// Helper for REST calls to Spring Boot backend
async function adminFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    const response = await fetch(`${API_HOST}${url}`, {
        ...options,
        headers
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        signOut(auth);
        hideApp();
        throw new Error("Session expirée ou droits insuffisants. Veuillez vous reconnecter.");
    }
    return response;
}

// Global Error Handler for Snapshots
const handleError = (error, context) => {
    console.error(`Firestore Error [${context}]:`, error);
};

// Check auth state on load
window.onload = async () => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    if (token && userStr) {
        try {
            const userData = JSON.parse(userStr);
            // Sign in anonymously to Firebase to satisfy Firestore rules (non-blocking)
            try {
                await signInAnonymously(auth);
            } catch (fbErr) {
                console.warn("Firebase anonymous sign-in failed/disabled:", fbErr);
            }
            showApp(userData);
        } catch (e) {
            console.error("Auth initialization error:", e);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            hideApp();
        }
    } else {
        hideApp();
    }
};

// Login Form Submit (Professional Email + Password)
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');
    const signInBtn = document.getElementById('signInBtn');
    
    errorMsg.innerText = "";
    
    // Set loading state
    const originalBtnHtml = signInBtn.innerHTML;
    signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion en cours...';
    signInBtn.disabled = true;

    try {
        const res = await fetch(`${API_HOST}/api/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Sign in anonymously to Firebase to satisfy Firestore rules (non-blocking)
            try {
                await signInAnonymously(auth);
            } catch (fbErr) {
                console.warn("Firebase anonymous sign-in failed/disabled:", fbErr);
            }
            
            showApp(data.user);
        } else {
            errorMsg.innerText = data.message || "Identifiants incorrects.";
        }
    } catch (err) {
        errorMsg.innerText = "Erreur de connexion au serveur : " + err.message;
        console.error(err);
    } finally {
        // Reset button state
        signInBtn.innerHTML = originalBtnHtml;
        signInBtn.disabled = false;
    }
};

function showApp(userData) {
    document.getElementById('login-overlay').style.display = "none";
    document.getElementById('admin-app').style.display = "flex";
    document.getElementById('adminName').innerText = userData.fullName || userData.name || "Admin";
    const initialElem = document.getElementById('adminInitial');
    if (initialElem) {
        const name = userData.fullName || userData.name || "Admin";
        initialElem.innerText = name.charAt(0).toUpperCase();
    }
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Restreindre le bouton d'Opérations Internes uniquement à l'administrateur principal
    const isPrimaryAdmin = userData.email && userData.email.toLowerCase() === "mouhamadoufadiloundiaye@transen.org";
    const opBtn = document.getElementById('btn-internal-op');
    if (opBtn) {
        opBtn.style.display = isPrimaryAdmin ? "inline-flex" : "none";
    }

    initDashboard();
}

function hideApp() {
    document.getElementById('login-overlay').style.display = "flex";
    document.getElementById('admin-app').style.display = "none";
}

function initDashboard() {
    setupNavigation();
    setupFiltersAndSearch();
    syncGlobalStats();
    syncRecentActivity();
    syncLiveFeed();
    syncDrivers();
    syncCompanies();
    syncUsers();
    syncAdmins();
    syncDocumentsSection();
    syncFinanceSection();
    syncMarketsSection();
    syncChannelsSection();
}

function setupNavigation() {
    document.querySelectorAll('#mainNav a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
            document.getElementById(`section-${section}`).style.display = 'block';
            document.querySelectorAll('#mainNav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('sectionTitle').innerText = link.innerText;

            // Refresh on click
            if (section === 'companies') syncCompanies();
            if (section === 'admins') syncAdmins();
            if (section === 'dashboard') {
                syncGlobalStats();
                syncRecentActivity();
            }
            if (section === 'drivers') syncDrivers();
            if (section === 'users') syncUsers();
            if (section === 'documents') syncDocumentsSection();
            if (section === 'finance') syncFinanceSection();
            if (section === 'investments') syncInvestments();
            if (section === 'markets') syncMarketsSection();
            if (section === 'channels') syncChannelsSection();
        };
    });
}

async function syncGlobalStats() {
    console.log("Syncing Global Stats from REST API...");
    try {
        const res = await adminFetch('/api/admin/stats');
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('totalTrips').innerText = stats.totalTrips || 0;
            document.getElementById('totalUsers').innerText = stats.totalUsers || 0;
            document.getElementById('totalRevenue').innerText = (stats.totalRevenue || 0).toLocaleString() + " F";
            document.getElementById('estCommissions').innerText = (stats.estCommissions || 0).toLocaleString() + " F";
        }

        // Fetch compartments/markets for dashboard preview
        const resComp = await adminFetch('/api/admin/metrics/compartments');
        if (resComp.ok) {
            const data = await resComp.json();
            const m = data.markets;
            const c = data.categories;

            // 1. Markets
            const totalVol = m.public.volume + m.independent.volume;
            let publicPct = 50, independentPct = 50;
            if (totalVol > 0) {
                publicPct = Math.round((m.public.volume / totalVol) * 100);
                independentPct = 100 - publicPct;
            }
            document.getElementById('dashMarketPublicPct').innerText = publicPct + '%';
            document.getElementById('dashMarketIndependentPct').innerText = independentPct + '%';
            document.getElementById('dashMarketPublicBar').style.width = publicPct + '%';
            document.getElementById('dashMarketIndependentBar').style.width = independentPct + '%';

            // 2. Channels
            const totalServVol = (c.alloDakar.volume || 0) + (c.busCompany.volume || 0) + (c.yobante.volume || 0);
            let alloPct = 0, busPct = 0, yobPct = 0;
            if (totalServVol > 0) {
                alloPct = Math.round((c.alloDakar.volume / totalServVol) * 100);
                busPct = Math.round((c.busCompany.volume / totalServVol) * 100);
                yobPct = 100 - alloPct - busPct;
            }
            document.getElementById('dashChannelAlloDetail').innerText = formatCurrency(c.alloDakar.volume);
            document.getElementById('dashChannelAlloBar').style.width = alloPct + '%';
            document.getElementById('dashChannelBusDetail').innerText = formatCurrency(c.busCompany.volume);
            document.getElementById('dashChannelBusBar').style.width = busPct + '%';
            document.getElementById('dashChannelYobanteDetail').innerText = formatCurrency(c.yobante.volume);
            document.getElementById('dashChannelYobanteBar').style.width = yobPct + '%';
        }

        // Fetch finance for mobile money network split
        const resFin = await adminFetch('/api/admin/finance/stats');
        if (resFin.ok) {
            const data = await resFin.json();
            const wavePct = data.networks.wave.percentage ? Math.round(data.networks.wave.percentage) : 0;
            const omPct = data.networks.orangeMoney.percentage ? Math.round(data.networks.orangeMoney.percentage) : 0;
            const freePct = data.networks.freeMoney.percentage ? Math.round(data.networks.freeMoney.percentage) : 0;

            document.getElementById('dashWaveNetworkVal').innerText = `${wavePct}% (${formatCurrency(data.networks.wave.volume)})`;
            document.getElementById('dashOrangeNetworkVal').innerText = `${omPct}% (${formatCurrency(data.networks.orangeMoney.volume)})`;
            document.getElementById('dashFreeNetworkVal').innerText = `${freePct}% (${formatCurrency(data.networks.freeMoney.volume)})`;

            document.getElementById('dashWaveNetworkProgress').style.width = `${wavePct}%`;
            document.getElementById('dashOrangeNetworkProgress').style.width = `${omPct}%`;
            document.getElementById('dashFreeNetworkProgress').style.width = `${freePct}%`;
        }
    } catch (e) {
        console.error("Error fetching stats:", e);
    }
}

function syncRecentActivity() {
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(8));
    onSnapshot(q, 
        snap => {
            const tbody = document.getElementById('activityTableBody');
            tbody.innerHTML = "";
            snap.forEach(docSnap => {
                const t = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${docSnap.id.substring(0,6)}</td>
                    <td><span class="badge blue">${t.type?.toUpperCase() || 'COURSE'}</span></td>
                    <td>${t.clientName || 'Inconnu'}</td>
                    <td>${t.price} F</td>
                    <td style="color:var(--primary); font-weight:bold">${(t.price * 0.01).toFixed(0)} F</td>
                    <td><span class="status-tag ${t.status}">${t.status.toUpperCase()}</span></td>
                `;
                tbody.appendChild(tr);
            });
        },
        e => handleError(e, "Recent Activity")
    );
}

function syncLiveFeed() {
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(50));
    onSnapshot(q, 
        snap => {
            const tbody = document.getElementById('liveTripsTableBody');
            tbody.innerHTML = "";
            snap.forEach(docSnap => {
                const t = docSnap.data();
                const date = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString('fr-FR') : '--:--';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${date}</td>
                    <td>${formatServiceType(t)}</td>
                    <td><div style="font-size:0.8rem"><b>DE:</b> ${t.departure?.substring(0,25)}...<br><b>À:</b> ${t.destination?.substring(0,25)}...</div></td>
                    <td>${t.driverName || '<span style="color:gray">En recherche...</span>'}</td>
                    <td><span class="badge gold">${t.paymentMethod?.toUpperCase() || 'CASH'}</span></td>
                    <td><b>${t.price} F</b><br><small style="color:var(--primary)">Com (1%): ${(t.price * 0.01).toFixed(0)} F</small></td>
                    <td><span class="status-tag ${t.status}">${t.status.toUpperCase()}</span></td>
                `;
                tbody.appendChild(tr);
            });
        },
        e => handleError(e, "Live Feed")
    );
}

function formatCurrency(amount) {
    return (amount || 0).toLocaleString('fr-FR') + ' F';
}

window.allCompaniesMetrics = [];
window.allDriversMetrics = [];
window.allClientsMetrics = [];

async function syncCompanies() {
    console.log("Syncing Companies from REST API metrics...");
    try {
        const res = await adminFetch('/api/admin/metrics/companies');
        if (!res.ok) throw new Error("Impossible de charger les statistiques des compagnies.");
        const companies = await res.json();
        window.allCompaniesMetrics = companies;
        
        // Update top cards
        const totalComps = companies.length;
        const totalVolume = companies.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
        const totalDrivers = companies.reduce((acc, curr) => acc + (curr.totalDrivers || 0), 0);
        
        document.getElementById('metricsCompTotal').innerText = totalComps;
        document.getElementById('metricsCompVolume').innerText = formatCurrency(totalVolume);
        document.getElementById('metricsCompDrivers').innerText = totalDrivers;
        
        // Also update pending badges
        let pendingCount = companies.filter(c => c.verificationStatus === 'PENDING').length;
        const badge = document.getElementById('pendingCompBadge');
        if (badge) {
            badge.innerText = pendingCount;
            badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
        
        renderCompaniesList();
    } catch (e) {
        console.error("Error fetching companies:", e);
    }
}

function renderCompaniesList() {
    const tbody = document.getElementById('companiesTableBody');
    tbody.innerHTML = "";
    
    const filterType = document.querySelector('#companyTypeFilters .filter-chip.active')?.getAttribute('data-comp-type') || 'all';
    const searchQuery = document.getElementById('companySearchInput')?.value.toLowerCase() || '';
    
    const filtered = window.allCompaniesMetrics.filter(c => {
        const matchesType = (filterType === 'all' || c.type === filterType);
        const matchesSearch = c.name.toLowerCase().includes(searchQuery) || 
                              (c.managerName && c.managerName.toLowerCase().includes(searchQuery)) ||
                              (c.managerPhone && c.managerPhone.includes(searchQuery));
        return matchesType && matchesSearch;
    });
    
    filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.classList.add('tr-link');
        tr.style.cursor = 'pointer';
        
        tr.onclick = (e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            window.openCompanyDetails(c.id);
        };
        
        let docsHtml = '';
        if (c.rccmUrl || c.nineaUrl || c.managerFrontUrl || c.managerBackUrl || c.transportAuthUrl) {
            docsHtml = `<button class="btn-text" style="color:var(--primary); border:none; background:none; cursor:pointer; font-weight:bold; font-family:inherit;" onclick="window.openCompanyKyc('${c.id}')"><i class="fas fa-file-invoice"></i> Examiner KYC</button>`;
        } else {
            docsHtml = `<span style="color:gray; font-size:0.85rem;">Aucun document</span>`;
        }
        
        let statusClass = 'pending';
        if (c.verificationStatus === 'APPROVED') statusClass = 'completed';
        if (c.verificationStatus === 'REJECTED') statusClass = 'failed';
        
        const statusTag = `<span class="status-tag ${statusClass}">${c.verificationStatus}</span>`;
        
        tr.innerHTML = `
            <td><b>${c.name}</b></td>
            <td><span class="badge blue">${c.type}</span></td>
            <td>
                <b>${c.managerName || 'Non lié'}</b><br>
                <small>${c.managerPhone || ''}</small>
            </td>
            <td><b>${c.totalDrivers}</b></td>
            <td><b>${formatCurrency(c.totalRevenue)}</b></td>
            <td><b>${formatCurrency(c.walletBalance)}</b></td>
            <td>${statusTag}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="icon-btn glass" style="color:var(--primary);" title="Détails de la Compagnie" onclick="window.openCompanyDetails('${c.id}')"><i class="fas fa-chart-line"></i></button>
                    ${c.verificationStatus === 'PENDING' ? 
                      `<button class="icon-btn glass" style="color:var(--primary);" title="Vérifier KYC" onclick="window.openCompanyKyc('${c.id}')"><i class="fas fa-check-double"></i></button>` : 
                      `<button class="icon-btn glass" style="color:var(--text-dim);" title="Voir KYC" onclick="window.openCompanyKyc('${c.id}')"><i class="fas fa-eye"></i></button>`}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function syncDrivers() {
    console.log("Syncing Drivers from REST API...");
    try {
        const res = await adminFetch('/api/admin/metrics/drivers');
        if (!res.ok) throw new Error("Impossible de charger les statistiques des chauffeurs.");
        const drivers = await res.json();
        window.allDriversMetrics = drivers;
        
        const totalDrivers = drivers.length;
        const verifiedDriversCount = drivers.filter(d => d.isVerified).length;
        const totalVolume = drivers.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
        
        document.getElementById('metricsDriversTotal').innerText = totalDrivers;
        document.getElementById('metricsDriversActive').innerText = verifiedDriversCount;
        document.getElementById('metricsDriversVolume').innerText = formatCurrency(totalVolume);
        
        renderDriversList();
    } catch (e) {
        console.error("Error syncing drivers:", e);
    }
}

function renderDriversList() {
    const tbody = document.getElementById('driversTableBody');
    tbody.innerHTML = "";
    
    const filterMarket = document.querySelector('#driverMarketFilters .filter-chip.active')?.getAttribute('data-driver-market') || 'all';
    const searchQuery = document.getElementById('driverSearchInput')?.value.toLowerCase() || '';
    
    const filtered = window.allDriversMetrics.filter(d => {
        const isIndependent = d.companyId === null;
        const matchesMarket = (filterMarket === 'all' || 
                              (filterMarket === 'independent' && isIndependent) ||
                              (filterMarket === 'company' && !isIndependent));
        const matchesSearch = d.fullName.toLowerCase().includes(searchQuery) || 
                              d.phone.includes(searchQuery);
        return matchesMarket && matchesSearch;
    });
    
    filtered.forEach(d => {
        const tr = document.createElement('tr');
        tr.classList.add('tr-link');
        tr.style.cursor = 'pointer';
        tr.onclick = (e) => {
            if (e.target.closest('button')) return;
            window.openDriverDetails(d.id);
        };
        
        let osIcon = '<i class="fab fa-android" style="color:#3b82f6; font-size:1.15rem;" title="Android"></i>';
        if (d.deviceSystem === 'IOS') {
            osIcon = '<i class="fab fa-apple" style="color:#ec4899; font-size:1.15rem;" title="iOS"></i>';
        } else if (d.deviceSystem === 'WEB') {
            osIcon = '<i class="fas fa-globe" style="color:#10b981; font-size:1.15rem;" title="Web"></i>';
        }

        tr.innerHTML = `
            <td><b>${d.fullName}</b><br><small>${d.phone}</small></td>
            <td>
                ${d.companyId ? `<span class="badge blue">${d.companyName}</span>` : `<span class="badge gold">Indépendant</span>`}
            </td>
            <td><b>${d.totalTrips}</b></td>
            <td><b>${formatCurrency(d.totalRevenue)}</b></td>
            <td><b>${formatCurrency(d.walletBalance)}</b></td>
            <td><span class="status-tag ${d.isVerified ? 'completed' : 'pending'}">${d.isVerified ? 'OUI' : 'NON'}</span></td>
            <td style="text-align:center;">${osIcon}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="icon-btn glass" style="color:var(--primary);" title="Statistiques" onclick="window.openDriverDetails('${d.id}')"><i class="fas fa-chart-line"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function syncUsers() {
    console.log("Syncing Clients from REST API...");
    try {
        const res = await adminFetch('/api/admin/metrics/clients');
        if (!res.ok) throw new Error("Impossible de charger les statistiques des clients.");
        const clients = await res.json();
        window.allClientsMetrics = clients;
        
        const totalClients = clients.length;
        const totalSpent = clients.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0);
        const avgSpent = totalClients > 0 ? totalSpent / totalClients : 0;
        
        document.getElementById('metricsClientsTotal').innerText = totalClients;
        document.getElementById('metricsClientsVolume').innerText = formatCurrency(totalSpent);
        document.getElementById('metricsClientsAverage').innerText = formatCurrency(avgSpent);
        
        // Fetch OS downloads count from compartments endpoint
        const resComp = await adminFetch('/api/admin/metrics/compartments');
        if (resComp.ok) {
            const data = await resComp.json();
            const channels = data.channels || {};
            document.getElementById('metricsAndroidDownloads').innerText = channels.androidUsers || 0;
            document.getElementById('metricsIosDownloads').innerText = channels.iosUsers || 0;
            document.getElementById('metricsWebDownloads').innerText = channels.webUsers || 0;
        }

        renderClientsList();
    } catch (e) {
        console.error("Error syncing clients:", e);
    }
}

function renderClientsList() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = "";
    
    const searchQuery = document.getElementById('clientSearchInput')?.value.toLowerCase() || '';
    
    const filtered = window.allClientsMetrics.filter(c => {
        return c.fullName.toLowerCase().includes(searchQuery) || 
               c.phone.includes(searchQuery) || 
               (c.email && c.email.toLowerCase().includes(searchQuery));
    });
    
    filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.classList.add('tr-link');
        tr.style.cursor = 'pointer';
        tr.onclick = (e) => {
            if (e.target.closest('button')) return;
            window.openClientDetails(c.id);
        };
        
        const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : 'Non renseigné';
        
        let osIcon = '<i class="fab fa-android" style="color:#3b82f6; font-size:1.15rem;" title="Android"></i>';
        if (c.deviceSystem === 'IOS') {
            osIcon = '<i class="fab fa-apple" style="color:#ec4899; font-size:1.15rem;" title="iOS"></i>';
        } else if (c.deviceSystem === 'WEB') {
            osIcon = '<i class="fas fa-globe" style="color:#10b981; font-size:1.15rem;" title="Web"></i>';
        }

        tr.innerHTML = `
            <td><b>${c.fullName}</b><br><small>${c.phone}</small></td>
            <td>${c.email || 'Non renseigné'}</td>
            <td>${dateStr}</td>
            <td><b>${c.totalTrips}</b></td>
            <td><b>${formatCurrency(c.totalSpent)}</b></td>
            <td><span class="badge blue">${c.favoriteCategory}</span></td>
            <td style="text-align:center;">${osIcon}</td>
            <td>
                <button class="icon-btn glass" style="color:var(--primary);" title="Détails" onclick="window.openClientDetails('${c.id}')"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function syncAdmins() {
    console.log("Syncing Administrators from REST API...");
    try {
        const res = await adminFetch('/api/admin/admins');
        if (!res.ok) throw new Error("Impossible de charger les administrateurs.");
        const admins = await res.json();
        
        const tbody = document.getElementById('adminsTableBody');
        tbody.innerHTML = "";
        
        const loggedInUserStr = localStorage.getItem('adminUser');
        const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
        const isMainAdmin = loggedInUser && loggedInUser.email && loggedInUser.email.toLowerCase() === 'mouhamadoufadiloundiaye@transen.org';
        
        admins.forEach(a => {
            const tr = document.createElement('tr');
            const dateStr = a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '--';
            
            let actionHtml = '';
            if (isMainAdmin && a.email.toLowerCase() !== 'mouhamadoufadiloundiaye@transen.org') {
                actionHtml = `<button class="icon-btn glass" style="color:var(--red);" onclick="window.deleteAdmin('${a.id}')"><i class="fas fa-trash-alt"></i></button>`;
            } else {
                actionHtml = `<span style="color:gray; font-size:0.8rem;">--</span>`;
            }
            
            tr.innerHTML = `
                <td><b>${a.fullName}</b></td>
                <td><span class="badge blue">${a.email}</span></td>
                <td>${a.phone}</td>
                <td>${dateStr}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error fetching admins:", e);
    }
}

window.deleteAdmin = (id) => {
    window.showConfirmDrawer(
        "Révoquer l'Administrateur",
        "Voulez-vous vraiment révoquer les droits de cet administrateur ? Il sera rétrogradé au rôle CLIENT.",
        true,
        async () => {
            try {
                const res = await adminFetch(`/api/admin/admins/${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message || "Administrateur supprimé avec succès.");
                    syncAdmins();
                } else {
                    alert("Erreur: " + (data.error || "Impossible de supprimer l'administrateur."));
                }
            } catch (err) {
                alert("Erreur de connexion au serveur.");
                console.error(err);
            }
        }
    );
};

function formatServiceType(t) {
    if (t.isPool) return '<span class="badge blue">COVOITURAGE</span>';
    if (t.isYobante) return '<span class="badge gold">YOBANTÉ</span>';
    return '<span class="badge green">COURSE</span>';
}

window.toggleDriver = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, "users", id), { status: newStatus });
};

window.openDoc = (userId, img) => {
    const modal = document.getElementById('docModal');
    document.getElementById('modalDocImg').src = img || 'https://via.placeholder.com/400';
    modal.style.display = "block";
    document.getElementById('approveDocBtn').onclick = () => {
        updateDoc(doc(db, "users", userId), { isVerified: true })
            .then(() => {
                modal.style.display = "none";
                window.showNotificationDrawer("Succès", "Chauffeur approuvé avec succès !", false);
                syncDocumentsSection();
            });
    };
    document.getElementById('rejectDocBtn').onclick = () => {
        updateDoc(doc(db, "users", userId), { isVerified: false, status: 'rejected' })
            .then(() => {
                modal.style.display = "none";
                window.showNotificationDrawer("Dossier Rejeté", "Le permis du chauffeur a été rejeté.", true);
                syncDocumentsSection();
            });
    };
};

window.openCompanyKyc = async (id) => {
    try {
        const res = await adminFetch('/api/admin/companies');
        if (!res.ok) throw new Error("Impossible de charger les compagnies");
        const companies = await res.json();
        const c = companies.find(item => item.id === id);
        if (!c) return;
        
        const modal = document.getElementById('companyKycModal');
        document.getElementById('kycModalTitle').innerText = `Dossier KYC : ${c.name}`;
        document.getElementById('companyRejectionReason').value = c.rejectionReason || '';
        
        const previewImg = document.getElementById('kycDocPreview');
        previewImg.src = 'https://via.placeholder.com/400x500?text=Sélectionnez+un+document';
        previewImg.style.display = 'block';
        
        const externalLink = document.getElementById('kycOpenExternal');
        if (externalLink) externalLink.style.display = 'none';
        
        // Remove any existing preview iframe to start clean
        const existingIframe = document.getElementById('kycDocIframe');
        if (existingIframe) existingIframe.remove();
        
        const setupDocLink = (elemId, url) => {
            const elem = document.getElementById(elemId);
            if (url) {
                elem.style.display = 'block';
                elem.href = url;
                elem.target = "_blank";
                
                elem.onclick = (e) => {
                    e.preventDefault();
                    
                    // Show external link option
                    if (externalLink) {
                        externalLink.href = url;
                        externalLink.style.display = 'inline-flex';
                        externalLink.style.alignItems = 'center';
                        externalLink.style.gap = '5px';
                    }
                    
                    const lowerUrl = url.toLowerCase();
                    const isPdf = lowerUrl.includes('.pdf');
                    
                    // Cleanup existing iframe first
                    const prevIframe = document.getElementById('kycDocIframe');
                    if (prevIframe) prevIframe.remove();
                    
                    if (isPdf) {
                        previewImg.style.display = 'none';
                        
                        const iframe = document.createElement('iframe');
                        iframe.id = 'kycDocIframe';
                        iframe.src = url;
                        iframe.style.width = '100%';
                        iframe.style.height = '380px';
                        iframe.style.border = 'none';
                        iframe.style.borderRadius = '10px';
                        previewImg.parentNode.insertBefore(iframe, externalLink);
                    } else {
                        previewImg.src = url;
                        previewImg.style.display = 'block';
                    }
                };
            } else {
                elem.style.display = 'none';
            }
        };
        
        setupDocLink('viewRccm', c.rccmUrl);
        setupDocLink('viewNinea', c.nineaUrl);
        setupDocLink('viewIdFront', c.managerFrontUrl);
        setupDocLink('viewIdBack', c.managerBackUrl);
        setupDocLink('viewAuth', c.transportAuthUrl);
        
        const deleteDocsBtn = document.getElementById('deleteCompanyDocsBtn');
        if (c.rccmUrl || c.nineaUrl || c.managerFrontUrl || c.managerBackUrl || c.transportAuthUrl) {
            deleteDocsBtn.style.display = 'inline-flex';
            deleteDocsBtn.onclick = () => {
                window.showConfirmDrawer(
                    "Supprimer les Documents",
                    "Voulez-vous vraiment supprimer définitivement tous les documents physiques de cette compagnie ?",
                    true,
                    async () => {
                        const actionRes = await adminFetch(`/api/admin/companies/${id}/delete-documents`, {
                            method: 'POST'
                        });
                        if (actionRes.ok) {
                            window.showNotificationDrawer("Succès", "Documents KYC supprimés définitivement !", false);
                            modal.style.display = "none";
                            
                            // Cleanup preview
                            const iframe = document.getElementById('kycDocIframe');
                            if (iframe) iframe.remove();
                            previewImg.src = 'https://via.placeholder.com/400x500?text=Sélectionnez+un+document';
                            previewImg.style.display = 'block';
                            if (externalLink) externalLink.style.display = 'none';
                            
                            syncCompanies();
                        } else {
                            const errMsg = await actionRes.text();
                            window.showNotificationDrawer("Erreur", errMsg, true);
                        }
                    }
                );
            };
        } else {
            deleteDocsBtn.style.display = 'none';
        }

        modal.style.display = "block";
        
        document.getElementById('approveCompanyBtn').onclick = () => {
            window.showConfirmDrawer(
                "Approuver la Compagnie",
                "Voulez-vous vraiment approuver et activer cette compagnie ?",
                false,
                async () => {
                    const actionRes = await adminFetch(`/api/admin/companies/${id}/verify?status=APPROVED`, {
                        method: 'POST'
                    });
                    if (actionRes.ok) {
                        window.showNotificationDrawer("Succès", "Compagnie approuvée et activée avec succès !", false);
                        modal.style.display = "none";
                        syncCompanies();
                        syncDocumentsSection();
                    } else {
                        const errMsg = await actionRes.text();
                        window.showNotificationDrawer("Erreur", errMsg, true);
                    }
                }
            );
        };
        
        document.getElementById('rejectCompanyBtn').onclick = () => {
            const reason = document.getElementById('companyRejectionReason').value.trim();
            if (!reason) {
                window.showNotificationDrawer("Attention", "La raison du rejet est obligatoire pour refuser un dossier.", true);
                return;
            }
            window.showConfirmDrawer(
                "Rejeter le Dossier",
                "Voulez-vous vraiment rejeter ce dossier ?",
                true,
                async () => {
                    const actionRes = await adminFetch(`/api/admin/companies/${id}/verify?status=REJECTED&rejectionReason=${encodeURIComponent(reason)}`, {
                        method: 'POST'
                    });
                    if (actionRes.ok) {
                        window.showNotificationDrawer("Succès", "Dossier KYC rejeté avec succès !", false);
                        modal.style.display = "none";
                        syncCompanies();
                        syncDocumentsSection();
                    } else {
                        const errMsg = await actionRes.text();
                        window.showNotificationDrawer("Erreur", errMsg, true);
                    }
                }
            );
        };
        
    } catch (e) {
        alert("Erreur: " + e.message);
    }
};

// Admin creation modal triggers
document.getElementById('addAdminBtn').onclick = () => {
    document.getElementById('adminCreateModal').style.display = "block";
};

document.getElementById('closeAdminCreateModal').onclick = () => {
    document.getElementById('adminCreateModal').style.display = "none";
};

document.getElementById('createAdminForm').onsubmit = async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('adminFullName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const phone = document.getElementById('adminPhone').value.trim();
    const password = document.getElementById('adminPassword').value;

    try {
        const res = await adminFetch('/api/admin/create-admin', {
            method: 'POST',
            body: JSON.stringify({ fullName, email, phone, password })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message || "Administrateur enregistré avec succès !");
            document.getElementById('adminCreateModal').style.display = "none";
            document.getElementById('createAdminForm').reset();
            syncAdmins();
        } else {
            alert("Erreur: " + (data.error || "Impossible d'enregistrer l'administrateur."));
        }
    } catch (err) {
        alert("Erreur de connexion au serveur.");
        console.error(err);
    }
};

const closeCompanyKycModal = document.getElementById('closeCompanyKycModal');
if (closeCompanyKycModal) {
    closeCompanyKycModal.onclick = () => {
        document.getElementById('companyKycModal').style.display = "none";
        // Clean up preview on close
        const iframe = document.getElementById('kycDocIframe');
        if (iframe) iframe.remove();
        const previewImg = document.getElementById('kycDocPreview');
        if (previewImg) {
            previewImg.src = 'https://via.placeholder.com/400x500?text=Sélectionnez+un+document';
            previewImg.style.display = 'block';
        }
        const externalLink = document.getElementById('kycOpenExternal');
        if (externalLink) externalLink.style.display = 'none';
    };
}

document.querySelector('.close-modal').onclick = () => document.getElementById('docModal').style.display = "none";

document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    signOut(auth).then(() => {
        hideApp();
    });
};

// Password Change Modal triggers
const pwdModal = document.getElementById('passwordChangeModal');
const settingsBtn = document.getElementById('settingsBtn');
const closePasswordModal = document.getElementById('closePasswordModal');
const changePasswordForm = document.getElementById('changePasswordForm');
const passwordErrorMsg = document.getElementById('passwordErrorMsg');

if (settingsBtn) {
    settingsBtn.onclick = () => {
        passwordErrorMsg.style.display = 'none';
        changePasswordForm.reset();
        pwdModal.style.display = 'block';
    };
}

if (closePasswordModal) {
    closePasswordModal.onclick = () => {
        pwdModal.style.display = 'none';
    };
}

if (changePasswordForm) {
    changePasswordForm.onsubmit = async (e) => {
        e.preventDefault();
        passwordErrorMsg.style.display = 'none';
        
        const submitBtn = document.getElementById('submitPasswordBtn');
        const originalHtml = submitBtn ? submitBtn.innerHTML : 'Enregistrer';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Modification en cours...';
            submitBtn.disabled = true;
        }
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmNewPassword) {
            passwordErrorMsg.innerText = "Les nouveaux mots de passe ne correspondent pas.";
            passwordErrorMsg.style.display = 'block';
            if (submitBtn) {
                submitBtn.innerHTML = originalHtml;
                submitBtn.disabled = false;
            }
            return;
        }
        
        try {
            const res = await adminFetch('/api/admin/change-password', {
                method: 'POST',
                body: JSON.stringify({ oldPassword, newPassword })
            });
            
            let data = {};
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                data = { error: text || `Erreur serveur (${res.status})` };
            }

            if (res.ok) {
                window.showNotificationDrawer("Succès", "Votre mot de passe a été modifié avec succès !", false);
                pwdModal.style.display = 'none';
            } else {
                passwordErrorMsg.innerText = data.error || "Une erreur est survenue.";
                passwordErrorMsg.style.display = 'block';
            }
        } catch (err) {
            passwordErrorMsg.innerText = "Erreur de connexion au serveur : " + err.message;
            passwordErrorMsg.style.display = 'block';
            console.error(err);
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalHtml;
                submitBtn.disabled = false;
            }
        }
    };
}


let pendingDriversList = [];
let pendingCompaniesList = [];

window.syncDocumentsSection = async function() {
    const listContainer = document.getElementById('docValidationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
            <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom: 10px; color: var(--primary);"></i>
            <p>Chargement des demandes de vérification...</p>
        </div>
    `;
    
    try {
        // 1. Fetch pending companies
        const res = await adminFetch('/api/admin/companies');
        let companies = [];
        if (res.ok) {
            companies = await res.json();
        }
        pendingCompaniesList = companies.filter(c => c.status === 'PENDING');
        
        // 2. Fetch pending drivers
        const driversSnap = await getDocs(query(collection(db, "users"), where("role", "==", "driver"), where("isVerified", "==", false)));
        pendingDriversList = [];
        driversSnap.forEach(docSnap => {
            pendingDriversList.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        window.renderDocumentsList();
    } catch (err) {
        console.error("Error syncing documents section:", err);
        listContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--red);">
                <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 10px;"></i>
                <p>Erreur lors du chargement : ${err.message}</p>
            </div>
        `;
    }
};

window.renderDocumentsList = function() {
    const listContainer = document.getElementById('docValidationList');
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    // Set grid layout styles dynamically to ensure premium rendering
    listContainer.style.display = "grid";
    listContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
    listContainer.style.gap = "20px";
    listContainer.style.padding = "20px 0";
    
    const totalCount = pendingCompaniesList.length + pendingDriversList.length;
    
    // Update badge
    const docBadge = document.getElementById('pendingDocBadge');
    if (docBadge) {
        docBadge.innerText = totalCount;
        docBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';
    }
    
    if (totalCount === 0) {
        listContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: var(--text-dim); background: rgba(255,255,255,0.02); border-radius: 15px; border: 1px dashed var(--glass-border);">
                <i class="fas fa-folder-open fa-3x" style="margin-bottom: 15px; color: var(--primary); opacity: 0.6;"></i>
                <h3 style="margin: 0 0 10px 0; color: white;">Tout est en ordre !</h3>
                <p style="margin: 0;">Aucune demande de vérification de document en attente pour le moment.</p>
            </div>
        `;
        return;
    }
    
    // Render Companies
    pendingCompaniesList.forEach(c => {
        const card = document.createElement('div');
        card.className = "glass-card";
        card.style.cssText = "padding: 20px; border-radius: 15px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--glass-border); background: var(--glass-bg); position: relative; overflow: hidden; transition: var(--transition);";
        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span class="badge blue" style="background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">COMPAGNIE</span>
                    <span class="status-tag pending">EN ATTENTE</span>
                </div>
                <h3 style="margin: 0 0 10px 0; color: white; font-size: 1.15rem; font-weight: 700;">${c.name}</h3>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                    <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-user" style="width: 18px;"></i> Gérant : <b>${c.managerName || 'Non spécifié'}</b></span>
                    <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-phone" style="width: 18px;"></i> Tél : <b>${c.managerPhone || 'N/A'}</b></span>
                </div>
            </div>
            <button class="btn-primary" style="width: 100%; padding: 12px; border: none; border-radius: 10px; background: var(--primary); color: white; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition);" onclick="window.openCompanyKyc('${c.id}')">
                <i class="fas fa-file-signature"></i> Examiner Dossier
            </button>
        `;
        listContainer.appendChild(card);
    });
    
    // Render Drivers
    pendingDriversList.forEach(d => {
        const card = document.createElement('div');
        card.className = "glass-card";
        card.style.cssText = "padding: 20px; border-radius: 15px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--glass-border); background: var(--glass-bg); position: relative; overflow: hidden; transition: var(--transition);";
        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span class="badge gold" style="background: rgba(241, 196, 15, 0.15); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">CHAUFFEUR</span>
                    <span class="status-tag pending">EN ATTENTE</span>
                </div>
                <h3 style="margin: 0 0 10px 0; color: white; font-size: 1.15rem; font-weight: 700;">${d.name}</h3>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                    <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-car" style="width: 18px;"></i> Véhicule : <b>${d.vehicleModel || 'N/A'} (${d.vehiclePlate || ''})</b></span>
                    <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-phone" style="width: 18px;"></i> Tél : <b>${d.phone || 'N/A'}</b></span>
                </div>
            </div>
            <button class="btn-primary" style="width: 100%; padding: 12px; border: none; border-radius: 10px; background: var(--primary); color: white; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition);" onclick="window.openDoc('${d.id}', '${d.licenseImageUrl}')">
                <i class="fas fa-id-card"></i> Examiner Permis
            </button>
        `;
        listContainer.appendChild(card);
    });
};

window.syncFinanceSection = async function() {
    console.log("Syncing Financial Flows...");
    try {
        const res = await adminFetch('/api/admin/finance/stats');
        if (!res.ok) throw new Error("Impossible de charger les statistiques financières.");
        const data = await res.json();
        
        const formatCurrency = (num) => {
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(num).replace('XOF', 'F CFA');
        };

        // 1. Key Metrics
        document.getElementById('financeTotalVolume').innerText = formatCurrency(data.totalVolume);
        document.getElementById('financeTotalCommissions').innerText = formatCurrency(data.totalCommissions);
        document.getElementById('financeTotalWalletBalances').innerText = formatCurrency(data.totalWalletBalances);

        // PayIn (Dépôts / Flux Entrants)
        document.getElementById('financePayinGross').innerText = formatCurrency(data.payin.gross);
        document.getElementById('financePayinSenePayFee').innerText = `-${formatCurrency(data.payin.senepayFee)}`;
        document.getElementById('financePayinFee').innerText = `-${formatCurrency(data.payin.operatorFee)}`;
        document.getElementById('financePayinNet').innerText = formatCurrency(data.payin.net);

        // PayOut (Retraits / Flux Sortants)
        document.getElementById('financePayoutGross').innerText = formatCurrency(data.payout.gross);
        document.getElementById('financePayoutFee').innerText = `-${formatCurrency(data.payout.operatorFee)}`;
        document.getElementById('financePayoutNet').innerText = formatCurrency(data.payout.net);

        // 2. Split Sectors
        const totalSect = data.sectors.alloDakar.volume + data.sectors.busCompany.volume + data.sectors.yobante.volume;
        const alloPct = totalSect > 0 ? (data.sectors.alloDakar.volume / totalSect) * 100 : 0;
        const busPct = totalSect > 0 ? (data.sectors.busCompany.volume / totalSect) * 100 : 0;
        const yobPct = totalSect > 0 ? (data.sectors.yobante.volume / totalSect) * 100 : 0;

        document.getElementById('alloDakarSectorVal').innerText = `${formatCurrency(data.sectors.alloDakar.volume)} (${formatCurrency(data.sectors.alloDakar.commissions)} comm.)`;
        document.getElementById('busCompanySectorVal').innerText = `${formatCurrency(data.sectors.busCompany.volume)} (${formatCurrency(data.sectors.busCompany.commissions)} comm.)`;
        document.getElementById('yobanteSectorVal').innerText = `${formatCurrency(data.sectors.yobante.volume)} (${formatCurrency(data.sectors.yobante.commissions)} comm.)`;

        document.getElementById('alloDakarSectorProgress').style.width = `${alloPct}%`;
        document.getElementById('busCompanySectorProgress').style.width = `${busPct}%`;
        document.getElementById('yobanteSectorProgress').style.width = `${yobPct}%`;

        // 3. Split Networks (Dynamic from backend)
        const wavePct = data.networks.wave.percentage ? Math.round(data.networks.wave.percentage) : 0;
        const omPct = data.networks.orangeMoney.percentage ? Math.round(data.networks.orangeMoney.percentage) : 0;
        const freePct = data.networks.freeMoney.percentage ? Math.round(data.networks.freeMoney.percentage) : 0;

        document.getElementById('waveNetworkVal').innerText = `${wavePct}% (${formatCurrency(data.networks.wave.volume)})`;
        document.getElementById('orangeNetworkVal').innerText = `${omPct}% (${formatCurrency(data.networks.orangeMoney.volume)})`;
        document.getElementById('freeNetworkVal').innerText = `${freePct}% (${formatCurrency(data.networks.freeMoney.volume)})`;

        document.getElementById('waveNetworkProgress').style.width = `${wavePct}%`;
        document.getElementById('orangeNetworkProgress').style.width = `${omPct}%`;
        document.getElementById('freeNetworkProgress').style.width = `${freePct}%`;

        // 4. Render Table
        const tbody = document.getElementById('financeTransactionsTableBody');
        tbody.innerHTML = "";

        if (!data.transactions || data.transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">Aucune transaction enregistrée.</td></tr>`;
            return;
        }

        data.transactions.forEach(t => {
            const tr = document.createElement('tr');
            const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString('fr-FR') : '--';
            
            // Format detenteur
            let ownerHtml = '';
            if (t.ownerName && t.ownerName !== 'N/A') {
                const ownerBadgeClass = t.walletOwnerType === 'COMPANY' ? 'blue' : 'gold';
                ownerHtml = `<b>${t.ownerName}</b> <span class="badge ${ownerBadgeClass}" style="font-size:0.65rem; padding:2px 4px; margin-left:5px;">${t.walletOwnerType}</span>`;
            } else {
                ownerHtml = `<span style="color:gray;">N/A</span>`;
            }

            // Format Type
            let typeBadge = '';
            if (t.type === 'TOP_UP') typeBadge = '<span class="status-tag completed" style="background:rgba(46,204,113,0.1); color:#2ecc71; border:1px solid rgba(46,204,113,0.2);">RECHARGEMENT</span>';
            else if (t.type === 'COMMISSION_FEE') typeBadge = '<span class="status-tag pending" style="background:rgba(52,152,219,0.1); color:#3498db; border:1px solid rgba(52,152,219,0.2);">COMMISSION (1%)</span>';
            else if (t.type === 'PAYOUT') typeBadge = '<span class="status-tag failed" style="background:rgba(231,76,60,0.1); color:#e74c3c; border:1px solid rgba(231,76,60,0.2);">RETRAIT</span>';
            else if (t.type === 'TICKET_REVENUE') typeBadge = '<span class="status-tag completed" style="background:rgba(241,196,15,0.1); color:#f1c40f; border:1px solid rgba(241,196,15,0.2);">TICKET REVENUE</span>';
            else typeBadge = `<span class="badge gray">${t.type}</span>`;

            // Format Amount
            const isPositive = t.type === 'TOP_UP' || t.type === 'TICKET_REVENUE';
            const amountColor = isPositive ? '#2ecc71' : '#e74c3c';
            const amountPrefix = isPositive ? '+' : '-';
            const amountHtml = `<span style="color:${amountColor}; font-weight:bold; font-family:monospace;">${amountPrefix} ${formatCurrency(Math.abs(t.amount))}</span>`;

            // Format Status
            let statusClass = 'pending';
            if (t.status === 'COMPLETED') statusClass = 'completed';
            if (t.status === 'FAILED') statusClass = 'failed';
            const statusTag = `<span class="status-tag ${statusClass}">${t.status}</span>`;

            tr.style.cursor = 'pointer';
            tr.title = 'Cliquez pour voir les détails de la transaction';
            tr.onclick = () => {
                window.openReceiptModal({
                    status: t.status,
                    amount: t.amount,
                    type: t.type,
                    ownerName: t.ownerName !== 'N/A' ? t.ownerName : 'Système TranSen',
                    createdAt: t.createdAt,
                    reference: t.reference || 'direct'
                });
            };
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${ownerHtml}</td>
                <td>${typeBadge}</td>
                <td><code style="font-size:0.8rem; background:rgba(255,255,255,0.05); padding:2px 5px; border-radius:4px;">${t.reference || 'direct'}</code></td>
                <td>${amountHtml}</td>
                <td>${statusTag}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error fetching financial stats:", err);
    }
};

// Internal Operations Modal
window.openInternalOpModal = function() {
    const modal = document.getElementById('internalOpModal');
    modal.style.display = "block";
};

// Close Modal
document.getElementById('closeInternalOpModal').onclick = () => {
    document.getElementById('internalOpModal').style.display = "none";
};

// Submit Internal Operation Form
document.getElementById('internalOpForm').onsubmit = async (e) => {
    e.preventDefault();
    const type = document.getElementById('internalOpType').value;
    const amount = parseFloat(document.getElementById('internalOpAmount').value);
    const phone = document.getElementById('internalOpPhone').value;
    const operator = document.getElementById('internalOpOperator').value;

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Lancement...`;

    try {
        const res = await adminFetch('/api/admin/finance/operation', {
            method: 'POST',
            body: JSON.stringify({ type, amount, phone, operator })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Erreur lors de l'initiation de la transaction SenePay.");
        }

        const data = await res.json();
        document.getElementById('internalOpModal').style.display = "none";
        document.getElementById('internalOpForm').reset();

        if (type === 'TOP_UP') {
            if (data.reference && (data.reference.startsWith('http://') || data.reference.startsWith('https://'))) {
                window.open(data.reference, '_blank');
                window.showNotificationDrawer("Succès", "Dépôt initié ! Le lien de paiement SenePay a été ouvert dans un nouvel onglet pour effectuer le règlement.", false);
            } else {
                window.showNotificationDrawer("Succès", "Dépôt initié avec succès sur SenePay ! Veuillez vérifier votre téléphone pour valider l'USSD Push.", false);
            }
        } else {
            window.showNotificationDrawer("Succès", "Demande de retrait réel transmise avec succès à SenePay ! Le transfert d'argent est en cours de traitement.", false);
        }
        await window.syncFinanceSection();
    } catch (err) {
        window.showNotificationDrawer("Erreur", err.message, true);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
};

// --- TRANSACTION RECEIPT MODAL LOGIC ---
const formatCurrencyGlobal = (num) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(num).replace('XOF', 'F CFA');
};

window.openReceiptModal = function(transaction) {
    const modal = document.getElementById('receiptModal');
    
    // Set status badge style
    const badge = document.getElementById('receiptStatusBadge');
    badge.innerText = transaction.status;
    badge.className = ""; // clear classes
    badge.style.padding = "6px 16px";
    badge.style.borderRadius = "30px";
    badge.style.fontWeight = "700";
    badge.style.fontSize = "0.85rem";
    badge.style.display = "inline-block";
    badge.style.textTransform = "uppercase";
    
    if (transaction.status === 'COMPLETED') {
        badge.style.background = "rgba(46, 204, 113, 0.15)";
        badge.style.color = "#2ecc71";
        badge.style.border = "1px solid rgba(46, 204, 113, 0.3)";
    } else if (transaction.status === 'FAILED') {
        badge.style.background = "rgba(231, 76, 60, 0.15)";
        badge.style.color = "#e74c3c";
        badge.style.border = "1px solid rgba(231, 76, 60, 0.3)";
    } else {
        badge.style.background = "rgba(241, 196, 15, 0.15)";
        badge.style.color = "#f1c40f";
        badge.style.border = "1px solid rgba(241, 196, 15, 0.3)";
    }

    // Amount formatting
    const isPositive = transaction.type === 'TOP_UP' || transaction.type === 'TICKET_REVENUE';
    const amountPrefix = isPositive ? '+' : '-';
    const amountVal = `${amountPrefix} ${formatCurrencyGlobal(Math.abs(transaction.amount))}`;
    document.getElementById('receiptAmount').innerText = amountVal;
    document.getElementById('receiptAmount').style.color = isPositive ? "#2ecc71" : "#e74c3c";

    // Set other details
    document.getElementById('receiptHolder').innerText = transaction.ownerName || 'Système TranSen';
    
    let typeText = transaction.type;
    if (transaction.type === 'TOP_UP') typeText = 'Dépôt / Rechargement';
    else if (transaction.type === 'PAYOUT') typeText = 'Retrait / Virement';
    else if (transaction.type === 'COMMISSION_FEE') typeText = 'Commission de Service';
    else if (transaction.type === 'TICKET_REVENUE') typeText = 'Revenu Vente Ticket';
    document.getElementById('receiptType').innerText = typeText;
    
    document.getElementById('receiptDate').innerText = transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('fr-FR') : '--';
    document.getElementById('receiptReference').innerText = transaction.reference || 'direct';

    // Store reference on modal
    modal.dataset.transactionRef = transaction.reference || 'recu';

    modal.style.display = "block";
};

// Close button click
document.getElementById('closeReceiptModalBtn').onclick = () => {
    document.getElementById('receiptModal').style.display = "none";
};

// Click outside modal to close
window.onclick = function(event) {
    const receiptModal = document.getElementById('receiptModal');
    const internalOpModal = document.getElementById('internalOpModal');
    const docModal = document.getElementById('docModal');
    const passwordModal = document.getElementById('passwordChangeModal');
    const companyDetailsModal = document.getElementById('companyDetailsModal');
    const driverDetailsModal = document.getElementById('driverDetailsModal');
    const clientDetailsModal = document.getElementById('clientDetailsModal');
    
    if (event.target === receiptModal) receiptModal.style.display = "none";
    if (event.target === internalOpModal) internalOpModal.style.display = "none";
    if (event.target === docModal) docModal.style.display = "none";
    if (event.target === passwordModal) passwordModal.style.display = "none";
    if (event.target === companyDetailsModal) companyDetailsModal.style.display = "none";
    if (event.target === driverDetailsModal) driverDetailsModal.style.display = "none";
    if (event.target === clientDetailsModal) clientDetailsModal.style.display = "none";
};

// Download as PNG
document.getElementById('downloadReceiptBtn').onclick = () => {
    const area = document.getElementById('receiptCaptureArea');
    const ref = document.getElementById('receiptModal').dataset.transactionRef || 'recu';
    
    html2canvas(area, {
        backgroundColor: '#1e1e2f', // Match receipt background
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Recu_TranSen_${ref}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error("Error generating PNG receipt:", err);
    });
};

// Filters and search registrations
function setupFiltersAndSearch() {
    // Companies filters
    document.querySelectorAll('#companyTypeFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#companyTypeFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderCompaniesList();
        });
    });
    
    document.getElementById('companySearchInput')?.addEventListener('input', () => {
        renderCompaniesList();
    });
    
    // Drivers filters
    document.querySelectorAll('#driverMarketFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#driverMarketFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderDriversList();
        });
    });
    
    document.getElementById('driverSearchInput')?.addEventListener('input', () => {
        renderDriversList();
    });
    
    // Clients search
    document.getElementById('clientSearchInput')?.addEventListener('input', () => {
        renderClientsList();
    });

    // Investments filters
    document.querySelectorAll('#investmentStatusFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#investmentStatusFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderInvestmentsList();
        });
    });
    
    document.getElementById('investmentSearchInput')?.addEventListener('input', () => {
        renderInvestmentsList();
    });
}

// Markets section sync
async function syncMarketsSection() {
    console.log("Syncing Markets comparison...");
    try {
        const res = await adminFetch('/api/admin/metrics/compartments');
        if (!res.ok) throw new Error("Impossible de charger les métriques de compartiments.");
        const data = await res.json();
        
        const m = data.markets;
        
        // Update top cards
        document.getElementById('marketPublicVolume').innerText = formatCurrency(m.public.volume);
        document.getElementById('marketIndependentVolume').innerText = formatCurrency(m.independent.volume);
        
        // Update public details
        document.getElementById('marketPublicVolDetail').innerText = formatCurrency(m.public.volume);
        document.getElementById('marketPublicTrips').innerText = m.public.tripCount;
        document.getElementById('marketPublicDrivers').innerText = m.public.driverCount;
        document.getElementById('marketPublicAvgPrice').innerText = formatCurrency(m.public.avgPrice);
        
        // Update independent details
        document.getElementById('marketIndependentVolDetail').innerText = formatCurrency(m.independent.volume);
        document.getElementById('marketIndependentTrips').innerText = m.independent.tripCount;
        document.getElementById('marketIndependentDrivers').innerText = m.independent.driverCount;
        document.getElementById('marketIndependentAvgPrice').innerText = formatCurrency(m.independent.avgPrice);
        
        // Update comparison progress bar
        const totalVol = m.public.volume + m.independent.volume;
        let publicPct = 50;
        let independentPct = 50;
        
        if (totalVol > 0) {
            publicPct = Math.round((m.public.volume / totalVol) * 100);
            independentPct = 100 - publicPct;
        }
        
        document.getElementById('marketPublicBar').style.width = publicPct + '%';
        document.getElementById('marketIndependentBar').style.width = independentPct + '%';
        
        document.getElementById('marketPublicPct').innerText = publicPct + '%';
        document.getElementById('marketIndependentPct').innerText = independentPct + '%';
        
    } catch (e) {
        console.error("Error syncing markets:", e);
    }
}

// Channels & Services section sync
async function syncChannelsSection() {
    console.log("Syncing Channels & Services...");
    try {
        const res = await adminFetch('/api/admin/metrics/compartments');
        if (!res.ok) throw new Error("Impossible de charger les métriques de compartiments.");
        const data = await res.json();
        
        const c = data.categories;
        const b = data.bookingTypes;
        
        // 1. Services bars
        const totalServVol = (c.alloDakar.volume || 0) + (c.busCompany.volume || 0) + (c.yobante.volume || 0);
        let alloPct = 0, busPct = 0, yobPct = 0;
        
        if (totalServVol > 0) {
            alloPct = Math.round((c.alloDakar.volume / totalServVol) * 100);
            busPct = Math.round((c.busCompany.volume / totalServVol) * 100);
            yobPct = 100 - alloPct - busPct;
        }
        
        document.getElementById('channelAlloDetail').innerText = `${formatCurrency(c.alloDakar.volume)} (${c.alloDakar.count} courses)`;
        document.getElementById('channelAlloBar').style.width = alloPct + '%';
        
        document.getElementById('channelBusDetail').innerText = `${formatCurrency(c.busCompany.volume)} (${c.busCompany.count} rés.)`;
        document.getElementById('channelBusBar').style.width = busPct + '%';
        
        document.getElementById('channelYobanteDetail').innerText = `${formatCurrency(c.yobante.volume)} (${c.yobante.count} colis)`;
        document.getElementById('channelYobanteBar').style.width = yobPct + '%';
        
        // 2. Booking types bars
        const totalBookingVol = (b.onDemand.volume || 0) + (b.scheduled.volume || 0);
        let onDemandPct = 50, scheduledPct = 50;
        
        if (totalBookingVol > 0) {
            onDemandPct = Math.round((b.onDemand.volume / totalBookingVol) * 100);
            scheduledPct = 100 - onDemandPct;
        }
        
        document.getElementById('channelOnDemandDetail').innerText = `${formatCurrency(b.onDemand.volume)} (${b.onDemand.count} courses)`;
        document.getElementById('channelOnDemandBar').style.width = onDemandPct + '%';
        
        document.getElementById('channelScheduledDetail').innerText = `${formatCurrency(b.scheduled.volume)} (${b.scheduled.count} rés.)`;
        document.getElementById('channelScheduledBar').style.width = scheduledPct + '%';
        
    } catch (e) {
        console.error("Error syncing channels:", e);
    }
}

// Company details modal
window.openCompanyDetails = (companyId) => {
    const company = window.allCompaniesMetrics.find(c => c.id === companyId);
    if (!company) return;
    
    document.getElementById('compDetailName').innerText = `Détails de ${company.name}`;
    document.getElementById('compDetailId').innerText = companyId;
    document.getElementById('compDetailDrivers').innerText = company.totalDrivers;
    document.getElementById('compDetailVolume').innerText = formatCurrency(company.totalRevenue);
    document.getElementById('compDetailWallet').innerText = formatCurrency(company.walletBalance);
    
    document.getElementById('compDetailFullName').innerText = company.name || '-';
    document.getElementById('compDetailType').innerText = company.type || '-';
    document.getElementById('compDetailAccessCode').innerText = company.accessCode || 'Aucun';
    document.getElementById('compDetailManagerName').innerText = company.managerName || 'Non lié';
    document.getElementById('compDetailManagerPhone').innerText = company.managerPhone || '-';
    document.getElementById('compDetailManagerEmail').innerText = company.managerEmail || '-';
    
    // Render drivers
    const driversBody = document.getElementById('compDetailDriversBody');
    driversBody.innerHTML = "";
    
    const companyDrivers = window.allDriversMetrics.filter(d => d.companyId === companyId);
    if (companyDrivers.length === 0) {
        driversBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray; padding: 20px;">Aucun chauffeur rattaché</td></tr>`;
    } else {
        companyDrivers.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${d.fullName}</b><br><small>${d.phone}</small></td>
                <td><b>${d.totalTrips}</b></td>
                <td><b>${formatCurrency(d.totalRevenue)}</b></td>
                <td><span class="status-tag ${d.isVerified ? 'completed' : 'pending'}">${d.isVerified ? 'OUI' : 'NON'}</span></td>
            `;
            driversBody.appendChild(tr);
        });
    }
    
    // Render transactions
    const txsBody = document.getElementById('compDetailTxsBody');
    txsBody.innerHTML = "";
    
    const txs = company.recentTransactions || [];
    if (txs.length === 0) {
        txsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:gray; padding: 20px;">Aucune transaction récente</td></tr>`;
    } else {
        txs.forEach(t => {
            const tr = document.createElement('tr');
            const dateStr = new Date(t.createdAt).toLocaleDateString('fr-FR');
            let statusClass = 'pending';
            if (t.status === 'COMPLETED') statusClass = 'completed';
            if (t.status === 'FAILED') statusClass = 'failed';
            
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="badge blue">${t.type}</span></td>
                <td><b>${formatCurrency(t.amount)}</b></td>
                <td><span class="status-tag ${statusClass}">${t.status}</span></td>
                <td><small style="font-family:monospace;">${t.reference || 'N/A'}</small></td>
            `;
            txsBody.appendChild(tr);
        });
    }
    
    // Tab switching inside company details modal
    const btnDrivers = document.getElementById('btnTabCompDrivers');
    const btnTxs = document.getElementById('btnTabCompTxs');
    const tabDrivers = document.getElementById('tabCompDrivers');
    const tabTxs = document.getElementById('tabCompTxs');
    
    btnDrivers.classList.add('active');
    btnTxs.classList.remove('active');
    tabDrivers.style.display = 'block';
    tabTxs.style.display = 'none';
    
    btnDrivers.onclick = () => {
        btnDrivers.classList.add('active');
        btnTxs.classList.remove('active');
        tabDrivers.style.display = 'block';
        tabTxs.style.display = 'none';
    };
    
    btnTxs.onclick = () => {
        btnTxs.classList.add('active');
        btnDrivers.classList.remove('active');
        tabTxs.style.display = 'block';
        tabDrivers.style.display = 'none';
    };
    
    // Setup administrative actions for Company
    const statusTextComp = document.getElementById('companyDetailStatusText');
    const blockBtnComp = document.getElementById('btnToggleBlockCompany');
    const deleteBtnComp = document.getElementById('btnDeleteCompany');

    const isCompActive = company.isActive !== false;
    statusTextComp.innerText = `Statut : ${isCompActive ? 'ACTIF' : 'BLOQUÉ'}`;
    statusTextComp.style.color = isCompActive ? '#10b981' : '#ef4444';
    
    blockBtnComp.innerHTML = isCompActive ? `<i class="fas fa-ban"></i> Bloquer` : `<i class="fas fa-check"></i> Débloquer`;
    blockBtnComp.style.color = isCompActive ? 'var(--red)' : '#10b981';
    blockBtnComp.style.borderColor = isCompActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    blockBtnComp.style.background = isCompActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)';

    blockBtnComp.onclick = async () => {
        const action = isCompActive ? 'block' : 'unblock';
        if (confirm(`Voulez-vous vraiment ${isCompActive ? 'bloquer' : 'débloquer'} cette compagnie ?`)) {
            try {
                const res = await adminFetch(`/api/admin/companies/${companyId}/${action}`, { method: 'POST' });
                if (!res.ok) throw new Error("Erreur de requête");
                showToast(`Compagnie ${isCompActive ? 'bloquée' : 'débloquée'} avec succès !`);
                document.getElementById('companyDetailsModal').style.display = "none";
                await syncGlobalStats();
                await syncCompanies();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };

    deleteBtnComp.onclick = async () => {
        if (confirm("Voulez-vous vraiment SUPPRIMER définitivement cette compagnie ? Cette action est irréversible et déliera ses chauffeurs.")) {
            try {
                const res = await adminFetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Erreur de requête");
                showToast("Compagnie supprimée avec succès !");
                document.getElementById('companyDetailsModal').style.display = "none";
                await syncGlobalStats();
                await syncCompanies();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };

    // Show modal
    document.getElementById('companyDetailsModal').style.display = "block";
};

// Driver details modal
window.openDriverDetails = (driverId) => {
    const driver = window.allDriversMetrics.find(d => d.id === driverId);
    if (!driver) return;
    
    document.getElementById('driverDetailName').innerText = `Détails de ${driver.fullName}`;
    document.getElementById('driverDetailId').innerText = driverId;
    document.getElementById('driverDetailTrips').innerText = driver.totalTrips;
    document.getElementById('driverDetailVolume').innerText = formatCurrency(driver.totalRevenue);
    document.getElementById('driverDetailWallet').innerText = formatCurrency(driver.walletBalance);
    
    document.getElementById('driverDetailFullName').innerText = driver.fullName || '-';
    document.getElementById('driverDetailPhone').innerText = driver.phone || '-';
    document.getElementById('driverDetailEmail').innerText = driver.email || '-';
    document.getElementById('driverDetailCompName').innerText = driver.companyName || 'Indépendant';
    document.getElementById('driverDetailOS').innerText = driver.deviceSystem || 'ANDROID';
    document.getElementById('driverDetailCreated').innerText = driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('fr-FR') : '-';
    
    const tripsBody = document.getElementById('driverDetailTripsBody');
    tripsBody.innerHTML = "";
    
    const trips = driver.recentTrips || [];
    if (trips.length === 0) {
        tripsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:gray; padding: 20px;">Aucun trajet complété</td></tr>`;
    } else {
        trips.forEach(t => {
            const tr = document.createElement('tr');
            const dateStr = new Date(t.createdAt).toLocaleDateString('fr-FR');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="badge blue">${t.category}</span></td>
                <td>${t.pickupLocation}</td>
                <td>${t.dropoffLocation}</td>
                <td><b>${formatCurrency(t.price)}</b></td>
            `;
            tripsBody.appendChild(tr);
        });
    }

    // Setup actions for driver
    const statusTextDrv = document.getElementById('driverDetailStatusText');
    const warnCountSpanDrv = document.getElementById('driverDetailWarnCount');
    const btnWarnDrv = document.getElementById('btnWarnDriver');
    const btnBlockDrv = document.getElementById('btnToggleBlockDriver');
    const btnDeleteDrv = document.getElementById('btnDeleteDriver');

    const isDrvActive = driver.isActive !== false;
    statusTextDrv.innerText = `Statut : ${isDrvActive ? 'ACTIF' : 'BLOQUÉ'}`;
    statusTextDrv.style.color = isDrvActive ? '#10b981' : '#ef4444';
    
    warnCountSpanDrv.innerText = driver.warningsCount || 0;
    
    btnBlockDrv.innerHTML = isDrvActive ? `<i class="fas fa-ban"></i> Bloquer` : `<i class="fas fa-check"></i> Débloquer`;
    btnBlockDrv.style.color = isDrvActive ? 'var(--red)' : '#10b981';
    btnBlockDrv.style.borderColor = isDrvActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    btnBlockDrv.style.background = isDrvActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)';

    btnWarnDrv.onclick = async () => {
        if (confirm(`Envoyer un avertissement officiel à ${driver.fullName} ?`)) {
            try {
                const res = await adminFetch(`/api/admin/users/${driverId}/warn`, { method: 'POST' });
                if (!res.ok) throw new Error("Erreur de requête");
                const resData = await res.json();
                
                // Firestore warning sync
                try {
                    await updateDoc(doc(db, "users", driverId), { 
                        warningsCount: resData.warningsCount || 1,
                        lastWarningAt: new Date().toISOString()
                    });
                } catch(err) {
                    console.warn("Firestore sync warning failed:", err);
                }

                showToast("Avertissement envoyé !");
                document.getElementById('driverDetailsModal').style.display = "none";
                await syncDrivers();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };

    btnBlockDrv.onclick = async () => {
        const action = isDrvActive ? 'block' : 'unblock';
        if (confirm(`Voulez-vous vraiment ${isDrvActive ? 'bloquer' : 'débloquer'} ce chauffeur ?`)) {
            try {
                const res = await adminFetch(`/api/admin/users/${driverId}/${action}`, { method: 'POST' });
                if (!res.ok) throw new Error("Erreur de requête");
                
                // Firestore block/unblock sync
                try {
                    await updateDoc(doc(db, "users", driverId), { 
                        status: isDrvActive ? 'blocked' : 'active',
                        isActive: !isDrvActive
                    });
                } catch(err) {
                    console.warn("Firestore sync status failed:", err);
                }

                showToast(`Chauffeur ${isDrvActive ? 'bloqué' : 'débloqué'} avec succès !`);
                document.getElementById('driverDetailsModal').style.display = "none";
                await syncDrivers();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };

    btnDeleteDrv.onclick = async () => {
        if (confirm("Voulez-vous vraiment SUPPRIMER définitivement ce compte chauffeur ? Cette action est définitive et irréversible.")) {
            try {
                const res = await adminFetch(`/api/admin/users/${driverId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Erreur de requête");
                
                // Firestore deletion sync
                try {
                    await updateDoc(doc(db, "users", driverId), { 
                        status: 'deleted',
                        isActive: false
                    });
                } catch(err) {
                    console.warn("Firestore sync deletion failed:", err);
                }

                showToast("Compte chauffeur supprimé définitivement !");
                document.getElementById('driverDetailsModal').style.display = "none";
                await syncDrivers();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };
    
    document.getElementById('driverDetailsModal').style.display = "block";
};

// Client details modal
window.openClientDetails = (clientId) => {
    const client = window.allClientsMetrics.find(c => c.id === clientId);
    if (!client) return;
    
    document.getElementById('clientDetailName').innerText = `Détails de ${client.fullName}`;
    document.getElementById('clientDetailId').innerText = clientId;
    document.getElementById('clientDetailTrips').innerText = client.totalTrips;
    document.getElementById('clientDetailVolume').innerText = formatCurrency(client.totalSpent);
    document.getElementById('clientDetailFav').innerText = client.favoriteCategory || 'Aucun';
    
    document.getElementById('clientDetailFullName').innerText = client.fullName || '-';
    document.getElementById('clientDetailPhone').innerText = client.phone || '-';
    document.getElementById('clientDetailEmail').innerText = client.email || '-';
    document.getElementById('clientDetailOS').innerText = client.deviceSystem || 'ANDROID';
    document.getElementById('clientDetailCreated').innerText = client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '-';
    
    const bookingsBody = document.getElementById('clientDetailTripsBody');
    bookingsBody.innerHTML = "";
    
    const bookings = client.recentBookings || [];
    if (bookings.length === 0) {
        bookingsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray; padding: 20px;">Aucune réservation complétée</td></tr>`;
    } else {
        bookings.forEach(b => {
            const tr = document.createElement('tr');
            const dateStr = new Date(b.createdAt).toLocaleDateString('fr-FR');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="badge blue">${b.category}</span></td>
                <td><b>${b.driverName || 'N/A'}</b></td>
                <td>${b.pickupLocation}</td>
                <td>${b.dropoffLocation}</td>
                <td><b>${formatCurrency(b.price)}</b></td>
            `;
            bookingsBody.appendChild(tr);
        });
    }

    // Setup actions for client
    const statusTextClt = document.getElementById('clientDetailStatusText');
    const warnCountSpanClt = document.getElementById('clientDetailWarnCount');
    const btnWarnClt = document.getElementById('btnWarnClient');
    const btnBlockClt = document.getElementById('btnToggleBlockClient');
    const btnDeleteClt = document.getElementById('btnDeleteClient');

    const isCltActive = client.isActive !== false;
    statusTextClt.innerText = `Statut : ${isCltActive ? 'ACTIF' : 'BLOQUÉ'}`;
    statusTextClt.style.color = isCltActive ? '#10b981' : '#ef4444';
    
    warnCountSpanClt.innerText = client.warningsCount || 0;
    
    btnBlockClt.innerHTML = isCltActive ? `<i class="fas fa-ban"></i> Bloquer` : `<i class="fas fa-check"></i> Débloquer`;
    btnBlockClt.style.color = isCltActive ? 'var(--red)' : '#10b981';
    btnBlockClt.style.borderColor = isCltActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    btnBlockClt.style.background = isCltActive ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)';

    btnWarnClt.onclick = async () => {
        if (confirm(`Envoyer un avertissement officiel à ${client.fullName} ?`)) {
            try {
                const res = await adminFetch(`/api/admin/users/${clientId}/warn`, { method: 'POST' });
                if (!res.ok) throw new Error("Erreur de requête");
                const resData = await res.json();
                
                // Firestore warning sync
                try {
                    await updateDoc(doc(db, "users", clientId), { 
                        warningsCount: resData.warningsCount || 1,
                        lastWarningAt: new Date().toISOString()
                    });
                } catch(err) {
                    console.warn("Firestore sync warning failed:", err);
                }

                showToast("Avertissement envoyé !");
                document.getElementById('clientDetailsModal').style.display = "none";
                await syncUsers();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };

    btnBlockClt.onclick = async () => {
        const action = isCltActive ? 'block' : 'unblock';
        if (confirm(`Voulez-vous vraiment ${isCltActive ? 'bloquer' : 'débloquer'} ce client ?`)) {
            try {
                const res = await adminFetch(`/api/admin/users/${clientId}/${action}`, { method: 'POST' });
                if (!res.ok) throw new Error("Erreur de requête");
                
                // Firestore block/unblock sync
                try {
                    await updateDoc(doc(db, "users", clientId), { 
                        status: isCltActive ? 'blocked' : 'active',
                        isActive: !isCltActive
                    });
                } catch(err) {
                    console.warn("Firestore sync status failed:", err);
                }

                showToast(`Client ${isCltActive ? 'bloqué' : 'débloqué'} avec succès !`);
                document.getElementById('clientDetailsModal').style.display = "none";
                await syncUsers();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };

    btnDeleteClt.onclick = async () => {
        if (confirm("Voulez-vous vraiment SUPPRIMER définitivement ce compte client ? Cette action est définitive et irréversible.")) {
            try {
                const res = await adminFetch(`/api/admin/users/${clientId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Erreur de requête");
                
                // Firestore deletion sync
                try {
                    await updateDoc(doc(db, "users", clientId), { 
                        status: 'deleted',
                        isActive: false
                    });
                } catch(err) {
                    console.warn("Firestore sync deletion failed:", err);
                }

                showToast("Compte client supprimé définitivement !");
                document.getElementById('clientDetailsModal').style.display = "none";
                await syncUsers();
            } catch(e) {
                showToast("Erreur : " + e.message, "error");
            }
        }
    };
    
    document.getElementById('clientDetailsModal').style.display = "block";
};

// Hook up close buttons
document.getElementById('closeCompanyDetailsModal').onclick = () => {
    document.getElementById('companyDetailsModal').style.display = "none";
};
document.getElementById('closeDriverDetailsModal').onclick = () => {
    document.getElementById('driverDetailsModal').style.display = "none";
};
document.getElementById('closeClientDetailsModal').onclick = () => {
    document.getElementById('clientDetailsModal').style.display = "none";
};

// Investment Management
window.allInvestments = [];

window.syncInvestments = async () => {
    console.log("Syncing Investments from REST API...");
    try {
        const res = await adminFetch('/api/admin/investments');
        if (!res.ok) throw new Error("Impossible de charger les investissements.");
        const list = await res.json();
        window.allInvestments = list;

        // Calculate metrics from active/approved/pending investments
        const activeInvestments = list.filter(i => i.status !== 'CANCELLED');
        const totalAmount = activeInvestments.reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalShares = activeInvestments.reduce((sum, item) => sum + (item.sharesCount || 0), 0);
        
        // Count unique investors based on phone number
        const uniqueInvestors = new Set(activeInvestments.map(i => i.phone)).size;

        document.getElementById('metricsInvestTotalAmount').innerText = formatCurrency(totalAmount);
        document.getElementById('metricsInvestTotalInvestors').innerText = uniqueInvestors;
        document.getElementById('metricsInvestTotalShares').innerText = totalShares.toLocaleString('fr-FR');

        renderInvestmentsList();
    } catch (e) {
        console.error("Error syncing investments:", e);
    }
};

window.renderInvestmentsList = () => {
    const tbody = document.getElementById('investmentsTableBody');
    tbody.innerHTML = "";

    const filterStatus = document.querySelector('#investmentStatusFilters .filter-chip.active')?.getAttribute('data-invest-status') || 'all';
    const searchQuery = document.getElementById('investmentSearchInput')?.value.toLowerCase() || '';

    const filtered = window.allInvestments.filter(item => {
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchesSearch = item.fullName.toLowerCase().includes(searchQuery) ||
                              (item.email && item.email.toLowerCase().includes(searchQuery)) ||
                              item.phone.includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '--';

        let statusClass = 'pending';
        let statusLabel = 'EN ATTENTE';
        if (item.status === 'APPROVED') {
            statusClass = 'completed';
            statusLabel = 'APPROUVÉ';
        } else if (item.status === 'CANCELLED') {
            statusClass = 'failed';
            statusLabel = 'ANNULÉ';
        }

        const statusTag = `<span class="status-tag ${statusClass}">${statusLabel}</span>`;

        let docHtml = '';
        if (item.kycDocUrl) {
            docHtml = `<button class="btn-text" style="color:var(--primary); border:none; background:none; cursor:pointer; font-weight:bold; font-family:inherit;" onclick="window.openInvestmentKyc('${item.id}')"><i class="fas fa-file-invoice"></i> Examiner KYC</button>`;
        } else {
            docHtml = `<span style="color:gray; font-size:0.85rem;">Aucun document</span>`;
        }

        let actionsHtml = '--';
        if (item.status === 'PENDING') {
            actionsHtml = `
                <div style="display: flex; gap: 8px;">
                    <button class="icon-btn glass" style="color:var(--primary);" title="Approuver l'investissement" onclick="window.updateInvestmentStatus('${item.id}', 'APPROVED')"><i class="fas fa-check"></i></button>
                    <button class="icon-btn glass" style="color:var(--red);" title="Annuler l'investissement" onclick="window.updateInvestmentStatus('${item.id}', 'CANCELLED')"><i class="fas fa-times"></i></button>
                </div>
            `;
        }

        tr.innerHTML = `
            <td><b>${item.fullName}</b></td>
            <td>
                <b>${item.phone}</b><br>
                <small style="color:var(--text-dim);">${item.email || 'Pas d\'email'}</small>
            </td>
            <td><b>${item.sharesCount.toLocaleString('fr-FR')}</b></td>
            <td><b>${formatCurrency(item.amount)}</b></td>
            <td>${dateStr}</td>
            <td>${statusTag}</td>
            <td>${docHtml}</td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.openInvestmentKyc = (id) => {
    const item = window.allInvestments.find(i => i.id === id);
    if (!item || !item.kycDocUrl) return;

    const modal = document.getElementById('investmentKycModal');
    const previewImg = document.getElementById('investorKycPreview');
    const iframe = document.getElementById('investorKycIframe');
    const externalLink = document.getElementById('investorKycExternalLink');

    const lowerUrl = item.kycDocUrl.toLowerCase();
    const isPdf = lowerUrl.includes('.pdf');

    if (isPdf) {
        previewImg.style.display = 'none';
        iframe.src = item.kycDocUrl;
        iframe.style.display = 'block';
    } else {
        iframe.style.display = 'none';
        previewImg.src = item.kycDocUrl;
        previewImg.style.display = 'block';
    }

    externalLink.href = item.kycDocUrl;
    externalLink.style.display = 'inline-block';

    modal.style.display = 'block';
};

window.updateInvestmentStatus = (id, newStatus) => {
    const actionLabel = newStatus === 'APPROVED' ? 'APPROUVER' : 'ANNULER';
    const msg = `Voulez-vous vraiment ${actionLabel} cette promesse d'investissement ?`;
    
    window.showConfirmDrawer(
        `${actionLabel} l'Investissement`,
        msg,
        newStatus === 'CANCELLED',
        async () => {
            try {
                const res = await adminFetch(`/api/admin/investments/${id}/status?status=${newStatus}`, {
                    method: 'PUT'
                });
                if (res.ok) {
                    window.showNotificationDrawer("Succès", `Investissement mis à jour avec succès.`, false);
                    window.syncInvestments();
                } else {
                    const data = await res.json();
                    window.showNotificationDrawer("Erreur", data.error || "Impossible de mettre à jour.", true);
                }
            } catch (err) {
                window.showNotificationDrawer("Erreur", "Erreur de connexion au serveur.", true);
                console.error(err);
            }
        }
    );
};

// Hook up close buttons
document.getElementById('closeInvestmentKycModal').onclick = () => {
    document.getElementById('investmentKycModal').style.display = "none";
};


