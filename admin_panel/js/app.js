import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, getDocs, updateDoc, where, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

const ADMIN_FETCH_TIMEOUT_MS = 15000;
const ADMIN_GET_CACHE_TTL_MS = 4000;
const ADMIN_MUTATION_COOLDOWN_MS = 1500;
const _adminGetCache = new Map();
const _adminInFlightGets = new Map();
const _adminInFlightMutations = new Set();
const _adminRecentMutations = new Map();

function escapeHtml(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _debounce(fn, delayMs = 220) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delayMs);
    };
}

function clearAdminCache() {
    _adminGetCache.clear();
}

function _genIdempotencyKey() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `adm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Helper for REST calls to Spring Boot backend (timeout + GET dedup/cache + anti-double-click + idempotency)
async function adminFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const fullUrl = `${API_HOST}${url}`;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isAuthRoute = url.includes('/auth/');
    const mutationKey = `${method}:${url}`;

    if (isMutation && !isAuthRoute) {
        const lastAt = _adminRecentMutations.get(mutationKey) || 0;
        if (_adminInFlightMutations.has(mutationKey) || (Date.now() - lastAt < ADMIN_MUTATION_COOLDOWN_MS)) {
            throw new Error("Action déjà en cours, veuillez patienter...");
        }
        _adminInFlightMutations.add(mutationKey);
        _adminRecentMutations.set(mutationKey, Date.now());
    }

    if (method === 'GET' && !isAuthRoute && !options.bypassCache) {
        const cached = _adminGetCache.get(url);
        if (cached && (Date.now() - cached.ts < ADMIN_GET_CACHE_TTL_MS)) {
            return new Response(cached.bodyText, {
                status: cached.status,
                headers: { 'Content-Type': cached.contentType || 'application/json' }
            });
        }
        if (_adminInFlightGets.has(url)) {
            const shared = await _adminInFlightGets.get(url);
            return new Response(shared.bodyText, {
                status: shared.status,
                headers: { 'Content-Type': shared.contentType || 'application/json' }
            });
        }
    }

    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(isMutation && !isAuthRoute ? { 'X-Idempotency-Key': _genIdempotencyKey() } : {}),
        ...options.headers
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || ADMIN_FETCH_TIMEOUT_MS);

    const execFetch = async () => {
        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers,
                signal: options.signal || controller.signal
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                signOut(auth);
                hideApp();
                throw new Error("Session expirée ou droits insuffisants. Veuillez vous reconnecter.");
            }

            if (isMutation && !isAuthRoute) {
                clearAdminCache();
            }

            if (method === 'GET' && response.ok && !isAuthRoute && !options.bypassCache) {
                const bodyText = await response.text();
                const contentType = response.headers.get('content-type') || 'application/json';
                const payload = { ts: Date.now(), status: response.status, bodyText, contentType };
                _adminGetCache.set(url, payload);
                return payload;
            }
            return { rawResponse: response };
        } catch (err) {
            if (err && err.name === 'AbortError') {
                throw new Error("Le serveur met trop de temps à répondre (15s). Réessayez.");
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
            if (isMutation && !isAuthRoute) {
                _adminInFlightMutations.delete(mutationKey);
            }
        }
    };

    if (method === 'GET' && !isAuthRoute && !options.bypassCache) {
        const promise = execFetch().finally(() => _adminInFlightGets.delete(url));
        _adminInFlightGets.set(url, promise);
        const result = await promise;
        if (result.rawResponse) return result.rawResponse;
        return new Response(result.bodyText, {
            status: result.status,
            headers: { 'Content-Type': result.contentType }
        });
    }

    const result = await execFetch();
    return result.rawResponse;
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

    let loginTimeoutId;
    try {
        const loginCtrl = new AbortController();
        loginTimeoutId = setTimeout(() => loginCtrl.abort(), ADMIN_FETCH_TIMEOUT_MS);
        const res = await fetch(`${API_HOST}/api/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: loginCtrl.signal
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
        errorMsg.innerText = err?.name === 'AbortError'
            ? "Délai d'attente dépassé (15s). Vérifiez le serveur."
            : "Erreur de connexion au serveur : " + err.message;
        console.error(err);
    } finally {
        clearTimeout(loginTimeoutId);
        // Reset button state
        signInBtn.innerHTML = originalBtnHtml;
        signInBtn.disabled = false;
    }
};

let _unsubRecentActivity = null;
let _unsubLiveFeed = null;

function stopFirestoreListeners() {
    if (_unsubRecentActivity) { _unsubRecentActivity(); _unsubRecentActivity = null; }
    if (_unsubLiveFeed) { _unsubLiveFeed(); _unsubLiveFeed = null; }
    if (typeof unsubscribeMediaHub === 'function') { unsubscribeMediaHub(); }
}

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
    stopFirestoreListeners();
    clearAdminCache();
    document.getElementById('login-overlay').style.display = "flex";
    document.getElementById('admin-app').style.display = "none";
}

function initDashboard() {
    setupNavigation();
    setupFiltersAndSearch();
    // Only boot visible dashboard + sidebar counters; heavy sections lazy-load on navigation
    syncGlobalStats();
    syncRecentActivity();
    syncCompanies();
    syncDocumentsSection();
}

function setupNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.onclick = () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        };
        sidebarOverlay.onclick = () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        };
    }

    document.querySelectorAll('#mainNav a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            
            // Auto close drawer on mobile navigation
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');

            const section = link.getAttribute('data-section');
            document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
            document.getElementById(`section-${section}`).style.display = 'block';
            document.querySelectorAll('#mainNav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('sectionTitle').innerText = link.innerText;

            if (section !== 'live' && _unsubLiveFeed) {
                _unsubLiveFeed();
                _unsubLiveFeed = null;
            }

            // Lazy-load & refresh active section
            if (section === 'companies') syncCompanies();
            else if (section === 'admins') syncAdmins();
            else if (section === 'live') syncLiveFeed();
            else if (section === 'dashboard') {
                syncGlobalStats();
                syncRecentActivity();
            }
            else if (section === 'drivers') syncDrivers();
            else if (section === 'users') syncUsers();
            else if (section === 'documents') syncDocumentsSection();
            else if (section === 'finance') syncFinanceSection();
            else if (section === 'investments') syncInvestments();
            else if (section === 'markets') syncMarketsSection();
            else if (section === 'channels') syncChannelsSection();
            else if (section === 'media-hub') syncMediaHubSection();
        };
    });
}

async function syncGlobalStats() {
    try {
        const [statsRes, compRes, finRes] = await Promise.allSettled([
            adminFetch('/api/admin/stats'),
            adminFetch('/api/admin/metrics/compartments'),
            adminFetch('/api/admin/finance/stats')
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
            const stats = await statsRes.value.json();
            document.getElementById('totalTrips').innerText = stats.totalTrips || 0;
            document.getElementById('totalUsers').innerText = stats.totalUsers || 0;
            document.getElementById('totalRevenue').innerText = (stats.totalRevenue || 0).toLocaleString() + " F";
            document.getElementById('estCommissions').innerText = (stats.estCommissions || 0).toLocaleString() + " F";
        }

        // Fetch compartments/markets for dashboard preview
        if (compRes.status === 'fulfilled' && compRes.value.ok) {
            const data = await compRes.value.json();
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
        if (finRes.status === 'fulfilled' && finRes.value.ok) {
            const data = await finRes.value.json();
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
    if (_unsubRecentActivity) {
        _unsubRecentActivity();
        _unsubRecentActivity = null;
    }
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(8));
    _unsubRecentActivity = onSnapshot(q, 
        snap => {
            const tbody = document.getElementById('activityTableBody');
            if (!tbody) return;
            const rows = [];
            snap.forEach(docSnap => {
                const t = docSnap.data();
                const priceNum = Number(t.price) || 0;
                const statusSafe = escapeHtml(t.status || 'pending');
                rows.push(`
                    <tr>
                        <td>#${escapeHtml(docSnap.id.substring(0, 6))}</td>
                        <td><span class="badge blue">${escapeHtml((t.type || 'COURSE').toUpperCase())}</span></td>
                        <td>${escapeHtml(t.clientName || 'Inconnu')}</td>
                        <td>${priceNum} F</td>
                        <td style="color:var(--primary); font-weight:bold">${(priceNum * 0.02).toFixed(0)} F</td>
                        <td><span class="status-tag ${statusSafe}">${statusSafe.toUpperCase()}</span></td>
                    </tr>
                `);
            });
            tbody.innerHTML = rows.join('');
        },
        e => handleError(e, "Recent Activity")
    );
}

function syncLiveFeed() {
    if (_unsubLiveFeed) {
        _unsubLiveFeed();
        _unsubLiveFeed = null;
    }
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(50));
    _unsubLiveFeed = onSnapshot(q, 
        snap => {
            const tbody = document.getElementById('liveTripsTableBody');
            if (!tbody) return;
            const rows = [];
            snap.forEach(docSnap => {
                const t = docSnap.data();
                const date = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString('fr-FR') : '--:--';
                const priceNum = Number(t.price) || 0;
                const dep = escapeHtml((t.departure || '').substring(0, 25));
                const dest = escapeHtml((t.destination || '').substring(0, 25));
                const drv = t.driverName ? escapeHtml(t.driverName) : '<span style="color:gray">En recherche...</span>';
                const statusSafe = escapeHtml(t.status || 'pending');
                rows.push(`
                    <tr>
                        <td>${escapeHtml(date)}</td>
                        <td>${formatServiceType(t)}</td>
                        <td><div style="font-size:0.8rem"><b>DE:</b> ${dep}...<br><b>À:</b> ${dest}...</div></td>
                        <td>${drv}</td>
                        <td><span class="badge gold">${escapeHtml((t.paymentMethod || 'CASH').toUpperCase())}</span></td>
                        <td><b>${priceNum} F</b><br><small style="color:var(--primary)">Com (2%): ${(priceNum * 0.02).toFixed(0)} F</small></td>
                        <td><span class="status-tag ${statusSafe}">${statusSafe.toUpperCase()}</span></td>
                    </tr>
                `);
            });
            tbody.innerHTML = rows.join('');
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
    if (!tbody) return;

    const filterType = document.querySelector('#companyTypeFilters .filter-chip.active')?.getAttribute('data-comp-type') || 'all';
    const searchQuery = document.getElementById('companySearchInput')?.value.toLowerCase() || '';

    const filtered = window.allCompaniesMetrics.filter(c => {
        const matchesType = (filterType === 'all' || c.type === filterType);
        const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery) ||
                              (c.managerName && c.managerName.toLowerCase().includes(searchQuery)) ||
                              (c.managerPhone && c.managerPhone.includes(searchQuery));
        return matchesType && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:gray; padding:24px;">Aucune compagnie trouvée.</td></tr>';
        return;
    }

    const capped = filtered.slice(0, 120);
    const rowsHtml = capped.map(c => {
        let statusClass = 'pending';
        if (c.verificationStatus === 'APPROVED') statusClass = 'completed';
        if (c.verificationStatus === 'REJECTED') statusClass = 'failed';
        const cid = escapeHtml(c.id);
        const statusTag = `<span class="status-tag ${statusClass}">${escapeHtml(c.verificationStatus || 'PENDING')}</span>`;

        return `
            <tr class="tr-link" style="cursor:pointer" data-company-id="${cid}">
                <td><b>${escapeHtml(c.name)}</b></td>
                <td><span class="badge blue">${escapeHtml(c.type)}</span></td>
                <td>
                    <b>${escapeHtml(c.managerName || 'Non lié')}</b><br>
                    <small>${escapeHtml(c.managerPhone || '')}</small>
                </td>
                <td><b>${c.totalDrivers || 0}</b></td>
                <td><b>${formatCurrency(c.totalRevenue)}</b></td>
                <td><b>${formatCurrency(c.walletBalance)}</b></td>
                <td>${statusTag}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="icon-btn glass" style="color:var(--primary);" title="Détails de la Compagnie" onclick="window.openCompanyDetails('${cid}')"><i class="fas fa-chart-line"></i></button>
                        ${c.verificationStatus === 'PENDING' ?
                          `<button class="icon-btn glass" style="color:var(--primary);" title="Vérifier KYC" onclick="window.openCompanyKyc('${cid}')"><i class="fas fa-check-double"></i></button>` :
                          `<button class="icon-btn glass" style="color:var(--text-dim);" title="Voir KYC" onclick="window.openCompanyKyc('${cid}')"><i class="fas fa-eye"></i></button>`}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const footerNote = filtered.length > 120
        ? `<tr><td colspan="8" style="text-align:center; color:var(--text-dim); font-size:0.82rem; padding:12px;">Affichage des 120 premières compagnies sur ${filtered.length}. Utilisez la recherche pour filtrer.</td></tr>`
        : '';

    tbody.innerHTML = rowsHtml + footerNote;
    tbody.onclick = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const tr = e.target.closest('tr[data-company-id]');
        if (tr) window.openCompanyDetails(tr.dataset.companyId);
    };
}

async function syncDrivers() {
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
    if (!tbody) return;

    const filterMarket = document.querySelector('#driverMarketFilters .filter-chip.active')?.getAttribute('data-driver-market') || 'all';
    const searchQuery = document.getElementById('driverSearchInput')?.value.toLowerCase() || '';

    const filtered = window.allDriversMetrics.filter(d => {
        const isIndependent = d.companyId === null;
        const matchesMarket = (filterMarket === 'all' ||
                              (filterMarket === 'independent' && isIndependent) ||
                              (filterMarket === 'company' && !isIndependent));
        const matchesSearch = (d.fullName || '').toLowerCase().includes(searchQuery) ||
                              (d.phone || '').includes(searchQuery);
        return matchesMarket && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:gray; padding:24px;">Aucun chauffeur trouvé.</td></tr>';
        return;
    }

    const capped = filtered.slice(0, 120);
    const rowsHtml = capped.map(d => {
        let osIcon = '<i class="fab fa-android" style="color:#3b82f6; font-size:1.15rem;" title="Android"></i>';
        if (d.deviceSystem === 'IOS') {
            osIcon = '<i class="fab fa-apple" style="color:#ec4899; font-size:1.15rem;" title="iOS"></i>';
        } else if (d.deviceSystem === 'WEB') {
            osIcon = '<i class="fas fa-globe" style="color:#10b981; font-size:1.15rem;" title="Web"></i>';
        }
        const did = escapeHtml(d.id);

        return `
            <tr class="tr-link" style="cursor:pointer" data-driver-id="${did}">
                <td><b>${escapeHtml(d.fullName)}</b><br><small>${escapeHtml(d.phone)}</small></td>
                <td>
                    ${d.companyId ? `<span class="badge blue">${escapeHtml(d.companyName)}</span>` : `<span class="badge gold">Indépendant</span>`}
                </td>
                <td><b>${d.totalTrips || 0}</b></td>
                <td><b>${formatCurrency(d.totalRevenue)}</b></td>
                <td><b>${formatCurrency(d.walletBalance)}</b></td>
                <td><span class="status-tag ${d.isVerified ? 'completed' : 'pending'}">${d.isVerified ? 'OUI' : 'NON'}</span></td>
                <td style="text-align:center;">${osIcon}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="icon-btn glass" style="color:var(--primary);" title="Statistiques" onclick="window.openDriverDetails('${did}')"><i class="fas fa-chart-line"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const footerNote = filtered.length > 120
        ? `<tr><td colspan="8" style="text-align:center; color:var(--text-dim); font-size:0.82rem; padding:12px;">Affichage des 120 premiers chauffeurs sur ${filtered.length}.</td></tr>`
        : '';

    tbody.innerHTML = rowsHtml + footerNote;
    tbody.onclick = (e) => {
        if (e.target.closest('button')) return;
        const tr = e.target.closest('tr[data-driver-id]');
        if (tr) window.openDriverDetails(tr.dataset.driverId);
    };
}

async function syncUsers() {
    try {
        const [clientsRes, compRes] = await Promise.allSettled([
            adminFetch('/api/admin/metrics/clients'),
            adminFetch('/api/admin/metrics/compartments')
        ]);

        if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
            const clients = await clientsRes.value.json();
            window.allClientsMetrics = clients;

            const totalClients = clients.length;
            const totalSpent = clients.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0);
            const avgSpent = totalClients > 0 ? totalSpent / totalClients : 0;

            document.getElementById('metricsClientsTotal').innerText = totalClients;
            document.getElementById('metricsClientsVolume').innerText = formatCurrency(totalSpent);
            document.getElementById('metricsClientsAverage').innerText = formatCurrency(avgSpent);
        }

        if (compRes.status === 'fulfilled' && compRes.value.ok) {
            const data = await compRes.value.json();
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
    if (!tbody) return;

    const searchQuery = document.getElementById('clientSearchInput')?.value.toLowerCase() || '';

    const filtered = window.allClientsMetrics.filter(c => {
        return (c.fullName || '').toLowerCase().includes(searchQuery) ||
               (c.phone || '').includes(searchQuery) ||
               (c.email && c.email.toLowerCase().includes(searchQuery));
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:gray; padding:24px;">Aucun client trouvé.</td></tr>';
        return;
    }

    const capped = filtered.slice(0, 120);
    const rowsHtml = capped.map(c => {
        const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : 'Non renseigné';
        let osIcon = '<i class="fab fa-android" style="color:#3b82f6; font-size:1.15rem;" title="Android"></i>';
        if (c.deviceSystem === 'IOS') {
            osIcon = '<i class="fab fa-apple" style="color:#ec4899; font-size:1.15rem;" title="iOS"></i>';
        } else if (c.deviceSystem === 'WEB') {
            osIcon = '<i class="fas fa-globe" style="color:#10b981; font-size:1.15rem;" title="Web"></i>';
        }
        const cid = escapeHtml(c.id);

        return `
            <tr class="tr-link" style="cursor:pointer" data-client-id="${cid}">
                <td><b>${escapeHtml(c.fullName)}</b><br><small>${escapeHtml(c.phone)}</small></td>
                <td>${escapeHtml(c.email || 'Non renseigné')}</td>
                <td>${escapeHtml(dateStr)}</td>
                <td><b>${c.totalTrips || 0}</b></td>
                <td><b>${formatCurrency(c.totalSpent)}</b></td>
                <td><span class="badge blue">${escapeHtml(c.favoriteCategory || 'Standard')}</span></td>
                <td style="text-align:center;">${osIcon}</td>
                <td>
                    <button class="icon-btn glass" style="color:var(--primary);" title="Détails" onclick="window.openClientDetails('${cid}')"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    const footerNote = filtered.length > 120
        ? `<tr><td colspan="8" style="text-align:center; color:var(--text-dim); font-size:0.82rem; padding:12px;">Affichage des 120 premiers clients sur ${filtered.length}.</td></tr>`
        : '';

    tbody.innerHTML = rowsHtml + footerNote;
    tbody.onclick = (e) => {
        if (e.target.closest('button')) return;
        const tr = e.target.closest('tr[data-client-id]');
        if (tr) window.openClientDetails(tr.dataset.clientId);
    };
}

async function syncAdmins() {
    try {
        const res = await adminFetch('/api/admin/admins');
        if (!res.ok) throw new Error("Impossible de charger les administrateurs.");
        const admins = await res.json();

        const tbody = document.getElementById('adminsTableBody');
        if (!tbody) return;

        const loggedInUserStr = localStorage.getItem('adminUser');
        const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
        const isMainAdmin = loggedInUser && loggedInUser.email && loggedInUser.email.toLowerCase() === 'mouhamadoufadiloundiaye@transen.org';

        tbody.innerHTML = admins.map(a => {
            const dateStr = a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '--';
            const aid = escapeHtml(a.id);
            const actionHtml = (isMainAdmin && a.email && a.email.toLowerCase() !== 'mouhamadoufadiloundiaye@transen.org')
                ? `<button class="icon-btn glass" style="color:var(--red);" onclick="window.deleteAdmin('${aid}')"><i class="fas fa-trash-alt"></i></button>`
                : `<span style="color:gray; font-size:0.8rem;">--</span>`;

            return `
                <tr>
                    <td><b>${escapeHtml(a.fullName)}</b></td>
                    <td><span class="badge blue">${escapeHtml(a.email)}</span></td>
                    <td>${escapeHtml(a.phone)}</td>
                    <td>${escapeHtml(dateStr)}</td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join('');
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
                    window.showNotificationDrawer("Succès", data.message || "Administrateur supprimé avec succès.", false);
                    syncAdmins();
                } else {
                    window.showNotificationDrawer("Erreur", data.error || "Impossible de supprimer l'administrateur.", true);
                }
            } catch (err) {
                window.showNotificationDrawer("Erreur", err.message || "Erreur de connexion au serveur.", true);
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
                        if (deleteDocsBtn.disabled) return;
                        deleteDocsBtn.disabled = true;
                        try {
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
                        } catch (err) {
                            window.showNotificationDrawer("Erreur", err.message || "Erreur serveur.", true);
                        } finally {
                            deleteDocsBtn.disabled = false;
                        }
                    }
                );
            };
        } else {
            deleteDocsBtn.style.display = 'none';
        }

        modal.style.display = "block";

        const approveBtn = document.getElementById('approveCompanyBtn');
        const rejectBtn = document.getElementById('rejectCompanyBtn');

        approveBtn.onclick = () => {
            window.showConfirmDrawer(
                "Approuver la Compagnie",
                "Voulez-vous vraiment approuver et activer cette compagnie ?",
                false,
                async () => {
                    if (approveBtn.disabled) return;
                    approveBtn.disabled = true;
                    try {
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
                    } catch (err) {
                        window.showNotificationDrawer("Erreur", err.message || "Erreur serveur.", true);
                    } finally {
                        approveBtn.disabled = false;
                    }
                }
            );
        };

        rejectBtn.onclick = () => {
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
                    if (rejectBtn.disabled) return;
                    rejectBtn.disabled = true;
                    try {
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
                    } catch (err) {
                        window.showNotificationDrawer("Erreur", err.message || "Erreur serveur.", true);
                    } finally {
                        rejectBtn.disabled = false;
                    }
                }
            );
        };
        
    } catch (e) {
        window.showNotificationDrawer("Erreur", e.message || "Impossible de charger le dossier.", true);
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
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && submitBtn.disabled) return;
    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    }

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
            window.showNotificationDrawer("Succès", data.message || "Administrateur enregistré avec succès !", false);
            document.getElementById('adminCreateModal').style.display = "none";
            form.reset();
            syncAdmins();
        } else {
            window.showNotificationDrawer("Erreur", data.error || "Impossible d'enregistrer l'administrateur.", true);
        }
    } catch (err) {
        window.showNotificationDrawer("Erreur", err.message || "Erreur de connexion au serveur.", true);
        console.error(err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
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
    
    // Render Companies + Drivers in batch with XSS escaping
    const companiesHtml = pendingCompaniesList.map(c => {
        const cid = escapeHtml(c.id);
        return `
            <div class="glass-card" style="padding: 20px; border-radius: 15px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--glass-border); background: var(--glass-bg); position: relative; overflow: hidden; transition: var(--transition);">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span class="badge blue" style="background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">COMPAGNIE</span>
                        <span class="status-tag pending">EN ATTENTE</span>
                    </div>
                    <h3 style="margin: 0 0 10px 0; color: white; font-size: 1.15rem; font-weight: 700;">${escapeHtml(c.name)}</h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                        <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-user" style="width: 18px;"></i> Gérant : <b>${escapeHtml(c.managerName || 'Non spécifié')}</b></span>
                        <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-phone" style="width: 18px;"></i> Tél : <b>${escapeHtml(c.managerPhone || 'N/A')}</b></span>
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%; padding: 12px; border: none; border-radius: 10px; background: var(--primary); color: white; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition);" onclick="window.openCompanyKyc('${cid}')">
                    <i class="fas fa-file-signature"></i> Examiner Dossier
                </button>
            </div>
        `;
    }).join('');

    const driversHtml = pendingDriversList.map(d => {
        const did = escapeHtml(d.id);
        const docUrl = escapeHtml(d.licenseImageUrl || '');
        return `
            <div class="glass-card" style="padding: 20px; border-radius: 15px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--glass-border); background: var(--glass-bg); position: relative; overflow: hidden; transition: var(--transition);">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span class="badge gold" style="background: rgba(241, 196, 15, 0.15); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">CHAUFFEUR</span>
                        <span class="status-tag pending">EN ATTENTE</span>
                    </div>
                    <h3 style="margin: 0 0 10px 0; color: white; font-size: 1.15rem; font-weight: 700;">${escapeHtml(d.name || d.fullName || 'Chauffeur')}</h3>
                    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
                        <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-car" style="width: 18px;"></i> Véhicule : <b>${escapeHtml(d.vehicleModel || 'N/A')} (${escapeHtml(d.vehiclePlate || '')})</b></span>
                        <span style="font-size: 0.85rem; color: var(--text-dim);"><i class="fas fa-phone" style="width: 18px;"></i> Tél : <b>${escapeHtml(d.phone || 'N/A')}</b></span>
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%; padding: 12px; border: none; border-radius: 10px; background: var(--primary); color: white; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition);" onclick="window.openDoc('${did}', '${docUrl}')">
                    <i class="fas fa-id-card"></i> Examiner Permis
                </button>
            </div>
        `;
    }).join('');

    listContainer.innerHTML = companiesHtml + driversHtml;
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

        // 4. Render Table (capped & batch rendered with XSS protection)
        const tbody = document.getElementById('financeTransactionsTableBody');
        if (!tbody) return;

        if (!data.transactions || data.transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">Aucune transaction enregistrée.</td></tr>`;
            return;
        }

        const cappedTxs = data.transactions.slice(0, 120);
        const rowsHtml = cappedTxs.map((t, idx) => {
            const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString('fr-FR') : '--';

            let ownerHtml = `<span style="color:gray;">N/A</span>`;
            if (t.ownerName && t.ownerName !== 'N/A') {
                const ownerBadgeClass = t.walletOwnerType === 'COMPANY' ? 'blue' : 'gold';
                ownerHtml = `<b>${escapeHtml(t.ownerName)}</b> <span class="badge ${ownerBadgeClass}" style="font-size:0.65rem; padding:2px 4px; margin-left:5px;">${escapeHtml(t.walletOwnerType)}</span>`;
            }

            let typeBadge = '';
            if (t.type === 'TOP_UP') typeBadge = '<span class="status-tag completed" style="background:rgba(46,204,113,0.1); color:#2ecc71; border:1px solid rgba(46,204,113,0.2);">RECHARGEMENT</span>';
            else if (t.type === 'COMMISSION_FEE') typeBadge = '<span class="status-tag pending" style="background:rgba(52,152,219,0.1); color:#3498db; border:1px solid rgba(52,152,219,0.2);">COMMISSION (2%)</span>';
            else if (t.type === 'SUBSCRIPTION') typeBadge = '<span class="status-tag completed" style="background:rgba(6,182,212,0.12); color:#06b6d4; border:1px solid rgba(6,182,212,0.25);">ABONNEMENT</span>';
            else if (t.type === 'PAYOUT') typeBadge = '<span class="status-tag failed" style="background:rgba(231,76,60,0.1); color:#e74c3c; border:1px solid rgba(231,76,60,0.2);">RETRAIT</span>';
            else if (t.type === 'TICKET_REVENUE') typeBadge = '<span class="status-tag completed" style="background:rgba(241,196,15,0.1); color:#f1c40f; border:1px solid rgba(241,196,15,0.2);">TICKET REVENUE</span>';
            else if (t.type === 'INVESTMENT') typeBadge = '<span class="status-tag completed" style="background:rgba(155,89,182,0.1); color:#9b59b6; border:1px solid rgba(155,89,182,0.2);">INVESTISSEMENT</span>';
            else typeBadge = `<span class="badge gray">${escapeHtml(t.type)}</span>`;

            const isPositive = t.type === 'TOP_UP' || t.type === 'TICKET_REVENUE' || t.type === 'INVESTMENT';
            const amountColor = isPositive ? '#2ecc71' : '#e74c3c';
            const amountPrefix = isPositive ? '+' : '-';
            const amountHtml = `<span style="color:${amountColor}; font-weight:bold; font-family:monospace;">${amountPrefix} ${formatCurrency(Math.abs(t.amount))}</span>`;

            let statusClass = 'pending';
            if (t.status === 'COMPLETED') statusClass = 'completed';
            if (t.status === 'FAILED') statusClass = 'failed';
            const statusTag = `<span class="status-tag ${statusClass}">${escapeHtml(t.status)}</span>`;

            return `
                <tr data-tx-idx="${idx}" style="cursor:pointer" title="Cliquez pour voir les détails de la transaction">
                    <td>${escapeHtml(dateStr)}</td>
                    <td>${ownerHtml}</td>
                    <td>${typeBadge}</td>
                    <td><code style="font-size:0.8rem; background:rgba(255,255,255,0.05); padding:2px 5px; border-radius:4px;">${escapeHtml(t.reference || 'direct')}</code></td>
                    <td>${amountHtml}</td>
                    <td>${statusTag}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;
        tbody.onclick = (e) => {
            const tr = e.target.closest('tr[data-tx-idx]');
            if (!tr) return;
            const t = cappedTxs[Number(tr.dataset.txIdx)];
            if (!t) return;
            window.openReceiptModal({
                status: t.status,
                amount: t.amount,
                type: t.type,
                ownerName: t.ownerName !== 'N/A' ? t.ownerName : 'Système TranSen',
                createdAt: t.createdAt,
                reference: t.reference || 'direct'
            });
        };

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
    const isPositive = transaction.type === 'TOP_UP' || transaction.type === 'TICKET_REVENUE' || transaction.type === 'INVESTMENT';
    const amountPrefix = isPositive ? '+' : '-';
    const amountVal = `${amountPrefix} ${formatCurrencyGlobal(Math.abs(transaction.amount))}`;
    document.getElementById('receiptAmount').innerText = amountVal;
    document.getElementById('receiptAmount').style.color = isPositive ? "#2ecc71" : "#e74c3c";

    // Set other details
    document.getElementById('receiptHolder').innerText = transaction.ownerName || 'Système TranSen';
    
    let typeText = transaction.type;
    if (transaction.type === 'TOP_UP') typeText = 'Dépôt / Rechargement';
    else if (transaction.type === 'PAYOUT') typeText = 'Retrait / Virement';
    else if (transaction.type === 'COMMISSION_FEE') typeText = 'Commission de Service (2%)';
    else if (transaction.type === 'SUBSCRIPTION') typeText = 'Abonnement Chauffeur';
    else if (transaction.type === 'TICKET_REVENUE') typeText = 'Revenu Vente Ticket';
    else if (transaction.type === 'INVESTMENT') typeText = 'Souscription Capital';
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
    
    document.getElementById('companySearchInput')?.addEventListener('input', _debounce(() => {
        renderCompaniesList();
    }, 220));
    
    // Drivers filters
    document.querySelectorAll('#driverMarketFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#driverMarketFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderDriversList();
        });
    });
    
    document.getElementById('driverSearchInput')?.addEventListener('input', _debounce(() => {
        renderDriversList();
    }, 220));
    
    // Clients search
    document.getElementById('clientSearchInput')?.addEventListener('input', _debounce(() => {
        renderClientsList();
    }, 220));

    // Investments filters
    document.querySelectorAll('#investmentStatusFilters .filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#investmentStatusFilters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderInvestmentsList();
        });
    });
    
    document.getElementById('investmentSearchInput')?.addEventListener('input', _debounce(() => {
        renderInvestmentsList();
    }, 220));
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

async function _runLockedAction(btn, actionFn) {
    if (!btn || btn.disabled) return;
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    try {
        await actionFn();
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
}

function _bindUserModerationButtons({
    userId,
    displayName,
    roleLabel,
    isActive,
    warnBtn,
    blockBtn,
    deleteBtn,
    modalId,
    refreshFn
}) {
    warnBtn.onclick = () => {
        window.showConfirmDrawer(
            `Avertir ce ${roleLabel}`,
            `Envoyer un avertissement officiel à ${displayName} ?`,
            false,
            () => _runLockedAction(warnBtn, async () => {
                try {
                    const res = await adminFetch(`/api/admin/users/${userId}/warn`, { method: 'POST' });
                    if (!res.ok) throw new Error("Erreur de requête");
                    const resData = await res.json();
                    try {
                        await updateDoc(doc(db, "users", userId), {
                            warningsCount: resData.warningsCount || 1,
                            lastWarningAt: new Date().toISOString()
                        });
                    } catch (err) {
                        console.warn("Firestore sync warning failed:", err);
                    }
                    window.showToast("Avertissement envoyé !");
                    document.getElementById(modalId).style.display = "none";
                    await refreshFn();
                } catch (e) {
                    window.showToast("Erreur : " + e.message, "error");
                }
            })
        );
    };

    blockBtn.onclick = () => {
        const action = isActive ? 'block' : 'unblock';
        const verb = isActive ? 'bloquer' : 'débloquer';
        window.showConfirmDrawer(
            `${isActive ? 'Bloquer' : 'Débloquer'} ce ${roleLabel}`,
            `Voulez-vous vraiment ${verb} ${displayName} ?`,
            isActive,
            () => _runLockedAction(blockBtn, async () => {
                try {
                    const res = await adminFetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' });
                    if (!res.ok) throw new Error("Erreur de requête");
                    try {
                        await updateDoc(doc(db, "users", userId), {
                            status: isActive ? 'blocked' : 'active',
                            isActive: !isActive
                        });
                    } catch (err) {
                        console.warn("Firestore sync status failed:", err);
                    }
                    window.showToast(`${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} ${isActive ? 'bloqué' : 'débloqué'} avec succès !`);
                    document.getElementById(modalId).style.display = "none";
                    await refreshFn();
                } catch (e) {
                    window.showToast("Erreur : " + e.message, "error");
                }
            })
        );
    };

    deleteBtn.onclick = () => {
        window.showConfirmDrawer(
            `Supprimer ce ${roleLabel}`,
            `Voulez-vous vraiment SUPPRIMER définitivement le compte de ${displayName} ? Cette action est irréversible.`,
            true,
            () => _runLockedAction(deleteBtn, async () => {
                try {
                    const res = await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error("Erreur de requête");
                    try {
                        await updateDoc(doc(db, "users", userId), {
                            status: 'deleted',
                            isActive: false
                        });
                    } catch (err) {
                        console.warn("Firestore sync deletion failed:", err);
                    }
                    window.showToast(`Compte ${roleLabel} supprimé définitivement !`);
                    document.getElementById(modalId).style.display = "none";
                    await refreshFn();
                } catch (e) {
                    window.showToast("Erreur : " + e.message, "error");
                }
            })
        );
    };
}

// Company details modal
window.openCompanyDetails = async (companyId) => {
    const company = window.allCompaniesMetrics.find(c => c.id === companyId);
    if (!company) return;

    if (window.allDriversMetrics.length === 0) {
        await syncDrivers();
    }

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
    const companyDrivers = window.allDriversMetrics.filter(d => d.companyId === companyId);
    if (companyDrivers.length === 0) {
        driversBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray; padding: 20px;">Aucun chauffeur rattaché</td></tr>`;
    } else {
        driversBody.innerHTML = companyDrivers.slice(0, 80).map(d => `
            <tr>
                <td><b>${escapeHtml(d.fullName)}</b><br><small>${escapeHtml(d.phone)}</small></td>
                <td><b>${d.totalTrips || 0}</b></td>
                <td><b>${formatCurrency(d.totalRevenue)}</b></td>
                <td><span class="status-tag ${d.isVerified ? 'completed' : 'pending'}">${d.isVerified ? 'OUI' : 'NON'}</span></td>
            </tr>
        `).join('');
    }

    // Render transactions
    const txsBody = document.getElementById('compDetailTxsBody');
    const txs = company.recentTransactions || [];
    if (txs.length === 0) {
        txsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:gray; padding: 20px;">Aucune transaction récente</td></tr>`;
    } else {
        txsBody.innerHTML = txs.slice(0, 80).map(t => {
            const dateStr = new Date(t.createdAt).toLocaleDateString('fr-FR');
            let statusClass = 'pending';
            if (t.status === 'COMPLETED') statusClass = 'completed';
            if (t.status === 'FAILED') statusClass = 'failed';
            return `
                <tr>
                    <td>${escapeHtml(dateStr)}</td>
                    <td><span class="badge blue">${escapeHtml(t.type)}</span></td>
                    <td><b>${formatCurrency(t.amount)}</b></td>
                    <td><span class="status-tag ${statusClass}">${escapeHtml(t.status)}</span></td>
                    <td><small style="font-family:monospace;">${escapeHtml(t.reference || 'N/A')}</small></td>
                </tr>
            `;
        }).join('');
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

    blockBtnComp.onclick = () => {
        const action = isCompActive ? 'block' : 'unblock';
        window.showConfirmDrawer(
            `${isCompActive ? 'Bloquer' : 'Débloquer'} la Compagnie`,
            `Voulez-vous vraiment ${isCompActive ? 'bloquer' : 'débloquer'} cette compagnie ?`,
            isCompActive,
            () => _runLockedAction(blockBtnComp, async () => {
                try {
                    const res = await adminFetch(`/api/admin/companies/${companyId}/${action}`, { method: 'POST' });
                    if (!res.ok) throw new Error("Erreur de requête");
                    window.showToast(`Compagnie ${isCompActive ? 'bloquée' : 'débloquée'} avec succès !`);
                    document.getElementById('companyDetailsModal').style.display = "none";
                    await Promise.allSettled([syncGlobalStats(), syncCompanies()]);
                } catch (e) {
                    window.showToast("Erreur : " + e.message, "error");
                }
            })
        );
    };

    deleteBtnComp.onclick = () => {
        window.showConfirmDrawer(
            "Supprimer la Compagnie",
            "Voulez-vous vraiment SUPPRIMER définitivement cette compagnie ? Cette action est irréversible et déliera ses chauffeurs.",
            true,
            () => _runLockedAction(deleteBtnComp, async () => {
                try {
                    const res = await adminFetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error("Erreur de requête");
                    window.showToast("Compagnie supprimée avec succès !");
                    document.getElementById('companyDetailsModal').style.display = "none";
                    await Promise.allSettled([syncGlobalStats(), syncCompanies()]);
                } catch (e) {
                    window.showToast("Erreur : " + e.message, "error");
                }
            })
        );
    };

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
    const trips = driver.recentTrips || [];
    if (trips.length === 0) {
        tripsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:gray; padding: 20px;">Aucun trajet complété</td></tr>`;
    } else {
        tripsBody.innerHTML = trips.slice(0, 80).map(t => {
            const dateStr = new Date(t.createdAt).toLocaleDateString('fr-FR');
            return `
                <tr>
                    <td>${escapeHtml(dateStr)}</td>
                    <td><span class="badge blue">${escapeHtml(t.category)}</span></td>
                    <td>${escapeHtml(t.pickupLocation)}</td>
                    <td>${escapeHtml(t.dropoffLocation)}</td>
                    <td><b>${formatCurrency(t.price)}</b></td>
                </tr>
            `;
        }).join('');
    }

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

    _bindUserModerationButtons({
        userId: driverId,
        displayName: driver.fullName,
        roleLabel: 'chauffeur',
        isActive: isDrvActive,
        warnBtn: btnWarnDrv,
        blockBtn: btnBlockDrv,
        deleteBtn: btnDeleteDrv,
        modalId: 'driverDetailsModal',
        refreshFn: syncDrivers
    });

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
    const bookings = client.recentBookings || [];
    if (bookings.length === 0) {
        bookingsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray; padding: 20px;">Aucune réservation complétée</td></tr>`;
    } else {
        bookingsBody.innerHTML = bookings.slice(0, 80).map(b => {
            const dateStr = new Date(b.createdAt).toLocaleDateString('fr-FR');
            return `
                <tr>
                    <td>${escapeHtml(dateStr)}</td>
                    <td><span class="badge blue">${escapeHtml(b.category)}</span></td>
                    <td><b>${escapeHtml(b.driverName || 'N/A')}</b></td>
                    <td>${escapeHtml(b.pickupLocation)}</td>
                    <td>${escapeHtml(b.dropoffLocation)}</td>
                    <td><b>${formatCurrency(b.price)}</b></td>
                </tr>
            `;
        }).join('');
    }

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

    _bindUserModerationButtons({
        userId: clientId,
        displayName: client.fullName,
        roleLabel: 'client',
        isActive: isCltActive,
        warnBtn: btnWarnClt,
        blockBtn: btnBlockClt,
        deleteBtn: btnDeleteClt,
        modalId: 'clientDetailsModal',
        refreshFn: syncUsers
    });

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

        const totalPaid = list.filter(i => i.status === 'PAID').reduce((sum, item) => sum + (item.amount || 0), 0);

        document.getElementById('metricsInvestTotalAmount').innerText = formatCurrency(totalAmount);
        document.getElementById('metricsInvestTotalInvestors').innerText = uniqueInvestors;
        document.getElementById('metricsInvestTotalShares').innerText = totalShares.toLocaleString('fr-FR');
        document.getElementById('metricsInvestTotalPaid').innerText = formatCurrency(totalPaid);

        renderInvestmentsList();
    } catch (e) {
        console.error("Error syncing investments:", e);
    }
};

window.renderInvestmentsList = () => {
    const tbody = document.getElementById('investmentsTableBody');
    if (!tbody) return;

    const filterStatus = document.querySelector('#investmentStatusFilters .filter-chip.active')?.getAttribute('data-invest-status') || 'all';
    const searchQuery = document.getElementById('investmentSearchInput')?.value.toLowerCase() || '';

    const filtered = window.allInvestments.filter(item => {
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchesSearch = (item.fullName || '').toLowerCase().includes(searchQuery) ||
                              (item.email && item.email.toLowerCase().includes(searchQuery)) ||
                              (item.phone || '').includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:gray; padding:24px;">Aucun investissement trouvé.</td></tr>';
        return;
    }

    const capped = filtered.slice(0, 120);
    tbody.innerHTML = capped.map((item, idx) => {
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
        } else if (item.status === 'PAID') {
            statusClass = 'completed';
            statusLabel = 'PAYÉ';
        } else if (item.status === 'CANCELLED') {
            statusClass = 'failed';
            statusLabel = 'ANNULÉ';
        }

        const iid = escapeHtml(item.id);
        const statusTag = `<span class="status-tag ${statusClass}">${statusLabel}</span>`;
        const docHtml = item.kycDocUrl
            ? `<button class="btn-text" style="color:var(--primary); border:none; background:none; cursor:pointer; font-weight:bold; font-family:inherit;" onclick="event.stopPropagation(); window.openInvestmentKyc('${iid}')"><i class="fas fa-file-invoice"></i> Examiner KYC</button>`
            : `<span style="color:gray; font-size:0.85rem;">Aucun document</span>`;

        const actionsHtml = item.status === 'PENDING'
            ? `<div style="display: flex; gap: 8px;">
                    <button class="icon-btn glass" style="color:var(--primary);" title="Approuver l'investissement" onclick="event.stopPropagation(); window.updateInvestmentStatus('${iid}', 'APPROVED')"><i class="fas fa-check"></i></button>
                    <button class="icon-btn glass" style="color:var(--red);" title="Annuler l'investissement" onclick="event.stopPropagation(); window.updateInvestmentStatus('${iid}', 'CANCELLED')"><i class="fas fa-times"></i></button>
               </div>`
            : '--';

        return `
            <tr data-invest-idx="${idx}" style="cursor:pointer" title="Cliquez pour voir les détails de cette souscription">
                <td><b>${escapeHtml(item.fullName)}</b></td>
                <td>
                    <b>${escapeHtml(item.phone)}</b><br>
                    <small style="color:var(--text-dim);">${escapeHtml(item.email || "Pas d'email")}</small>
                </td>
                <td><b>${(item.sharesCount || 0).toLocaleString('fr-FR')}</b></td>
                <td><b>${formatCurrency(item.amount)}</b></td>
                <td>${escapeHtml(dateStr)}</td>
                <td>${statusTag}</td>
                <td>${docHtml}</td>
                <td>${actionsHtml}</td>
            </tr>
        `;
    }).join('');

    tbody.onclick = (e) => {
        if (e.target.closest('button')) return;
        const tr = e.target.closest('tr[data-invest-idx]');
        if (!tr) return;
        const item = capped[Number(tr.dataset.investIdx)];
        if (item) window.openInvestmentDetails(item);
    };
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

// --- Investment Details Modal ---
window.openInvestmentDetails = (item) => {
    document.getElementById('detailInvestFullName').innerText = item.fullName;
    document.getElementById('detailInvestPhone').innerText = item.phone;
    document.getElementById('detailInvestEmail').innerText = item.email || 'Non renseigné';
    document.getElementById('detailInvestShares').innerText = item.sharesCount.toLocaleString('fr-FR') + ' actions';
    document.getElementById('detailInvestAmount').innerText = formatCurrency(item.amount);
    document.getElementById('detailInvestDate').innerText = item.createdAt ? new Date(item.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) : '--';

    // Status badge
    let statusClass = 'pending', statusLabel = 'EN ATTENTE';
    if (item.status === 'APPROVED') { statusClass = 'completed'; statusLabel = 'APPROUVÉ'; }
    else if (item.status === 'PAID') { statusClass = 'completed'; statusLabel = 'PAYÉ ✓'; }
    else if (item.status === 'CANCELLED') { statusClass = 'failed'; statusLabel = 'ANNULÉ'; }
    document.getElementById('detailInvestStatusBadge').innerHTML = `<span class="status-tag ${statusClass}">${statusLabel}</span>`;

    // KYC section
    const kycSection = document.getElementById('detailInvestKycSection');
    if (item.kycDocUrl) {
        kycSection.style.display = 'block';
        const fileName = item.kycDocUrl.split('/').pop() || 'Document KYC';
        document.getElementById('detailInvestKycName').innerText = fileName;
        document.getElementById('btnDetailViewKyc').onclick = () => {
            window.openInvestmentKyc(item.id);
        };
    } else {
        kycSection.style.display = 'none';
    }

    // Payment link section (show only for APPROVED investments)
    const paymentLinkSection = document.getElementById('detailInvestPaymentLinkSection');
    if (item.status === 'APPROVED') {
        paymentLinkSection.style.display = 'block';
        const paymentLink = `https://investir.transen.org/payment.html?id=${item.id}`;
        document.getElementById('detailInvestPaymentLink').value = paymentLink;
        document.getElementById('btnCopyPaymentLink').onclick = () => {
            navigator.clipboard.writeText(paymentLink);
            window.showNotificationDrawer('Copié !', 'Lien de paiement copié dans le presse-papiers.', false);
        };
    } else {
        paymentLinkSection.style.display = 'none';
    }

    // Actions footer
    const actionsFooter = document.getElementById('detailInvestActions');
    actionsFooter.innerHTML = '';
    if (item.status === 'PENDING') {
        actionsFooter.innerHTML = `
            <button class="btn-approve" onclick="document.getElementById('investmentDetailsModal').style.display='none'; window.updateInvestmentStatus('${item.id}', 'APPROVED')" style="padding: 10px 20px; background: var(--primary); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;"><i class="fas fa-check"></i> Approuver</button>
            <button class="btn-reject" onclick="document.getElementById('investmentDetailsModal').style.display='none'; window.updateInvestmentStatus('${item.id}', 'CANCELLED')" style="padding: 10px 20px; background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.3); border-radius: 10px; color: #e74c3c; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;"><i class="fas fa-times"></i> Annuler</button>
        `;
    } else if (item.status === 'APPROVED') {
        actionsFooter.innerHTML = `
            <button onclick="document.getElementById('investmentDetailsModal').style.display='none'; window.updateInvestmentStatus('${item.id}', 'CANCELLED')" style="padding: 10px 20px; background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.3); border-radius: 10px; color: #e74c3c; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;"><i class="fas fa-times"></i> Annuler</button>
        `;
    }

    document.getElementById('investmentDetailsModal').style.display = 'block';
};

// Hook up close buttons
document.getElementById('closeInvestmentKycModal').onclick = () => {
    document.getElementById('investmentKycModal').style.display = "none";
};

// ── HUB MÉDIA ADMINISTRATION LOGIC ─────────────────────────────────────────

let activeAnnouncements = [];
let currentMediaFilter = 'all';
let unsubscribeMediaHub = null;
let currentPreviewAudio = null;
let currentPreviewButton = null;
let modalPreviewAudio = null;

// Real-time synchronization
window.syncMediaHubSection = function() {
    console.log("Synchronizing Media Hub Section...");
    
    // Stop any existing listener
    if (unsubscribeMediaHub) {
        unsubscribeMediaHub();
    }
    
    // Stop any playing audio
    stopAllAudioPreview();
    
    const announcementsCol = collection(db, "announcements");
    
    unsubscribeMediaHub = onSnapshot(announcementsCol, (snapshot) => {
        activeAnnouncements = [];
        snapshot.forEach(doc => {
            activeAnnouncements.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Update stats
        updateMediaHubStats();
        
        // Render grid
        renderMediaHubGrid();
    }, (err) => {
        console.error("Error listening to announcements:", err);
        window.showNotificationDrawer('Erreur de Sync', 'Impossible de charger les annonces du Hub Média.', true);
    });
};

function updateMediaHubStats() {
    const total = activeAnnouncements.length;
    const withAudio = activeAnnouncements.filter(a => a.audioUrl && a.audioUrl.trim() !== '').length;
    const withTts = activeAnnouncements.filter(a => a.speakText && a.speakText.trim() !== '').length;
    
    document.getElementById('mediaTotalCount').innerText = total;
    document.getElementById('mediaAudioCount').innerText = withAudio;
    document.getElementById('mediaTtsCount').innerText = withTts;
}

function renderMediaHubGrid() {
    const grid = document.getElementById('announcementsGrid');
    grid.innerHTML = '';
    
    const filtered = activeAnnouncements.filter(a => {
        if (currentMediaFilter === 'all') return true;
        return a.icon === currentMediaFilter;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="glass-card" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-dim);">
                <i class="fas fa-bullhorn" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 15px;"></i>
                <p style="margin: 0; font-size: 1.1rem; font-weight: bold;">Aucune annonce trouvée</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Cliquez sur "Créer une Annonce" pour en ajouter une.</p>
            </div>
        `;
        return;
    }
    
    const iconMap = {
        'promo': 'fas fa-tags',
        'bus': 'fas fa-bus',
        'gift': 'fas fa-gift',
        'delivery': 'fas fa-truck',
        'info': 'fas fa-info-circle',
        'warning': 'fas fa-exclamation-triangle'
    };
    
    filtered.forEach(item => {
        const hasAudio = item.audioUrl && item.audioUrl.trim() !== '';
        const hasTts = item.speakText && item.speakText.trim() !== '';
        
        // Setup card visual properties
        const startColor = (item.gradientColors && item.gradientColors[0]) ? item.gradientColors[0] : '#2C3E50';
        const endColor = (item.gradientColors && item.gradientColors[1]) ? item.gradientColors[1] : '#3498DB';
        const accent = item.accentColor || '#ffffff';
        const iconClass = iconMap[item.icon] || 'fas fa-bullhorn';
        
        const card = document.createElement('div');
        card.className = 'announcement-mini-card';
        card.style.background = `linear-gradient(135deg, ${startColor}, ${endColor})`;
        card.style.borderColor = `rgba(255,255,255,0.15)`;
        
        let audioIndicatorHtml = '';
        if (hasAudio) {
            audioIndicatorHtml = `
                <div class="audio-badge-indicator">
                    <i class="fas fa-volume-up"></i> MP3
                </div>
            `;
        } else if (hasTts) {
            audioIndicatorHtml = `
                <div class="audio-badge-indicator" title="${item.speakText}">
                    <i class="fas fa-comment-dots"></i> TTS
                </div>
            `;
        }
        
        let playButtonHtml = '';
        if (hasAudio) {
            playButtonHtml = `
                <button type="button" class="mini-card-play-btn" data-audio-url="${item.audioUrl}" style="background: rgba(255,255,255,0.25); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s ease;">
                    <i class="fas fa-play"></i>
                </button>
            `;
        }
        
        let actionLabel = '';
        if (item.actionType === 'copy_promo') actionLabel = `Promo: ${item.actionValue || ''}`;
        else if (item.actionType === 'navigate_bus') actionLabel = 'Bus Lines';
        else if (item.actionType === 'navigate_referral') actionLabel = 'Parrainage';
        else if (item.actionType === 'open_url') actionLabel = 'Ouvrir URL';

        const targetChannel = item.channel || 'all';
        let channelIndicatorHtml = '';
        if (targetChannel === 'client') {
            channelIndicatorHtml = `<div class="audio-badge-indicator" style="background: rgba(46, 204, 113, 0.25); border: 1px solid rgba(46,204,113,0.4);" title="Clients uniquement"><i class="fas fa-user"></i> Clients</div>`;
        } else if (targetChannel === 'driver') {
            channelIndicatorHtml = `<div class="audio-badge-indicator" style="background: rgba(241, 196, 15, 0.25); border: 1px solid rgba(241,196,15,0.4);" title="Chauffeurs uniquement"><i class="fas fa-car"></i> Chauffeurs</div>`;
        } else {
            channelIndicatorHtml = `<div class="audio-badge-indicator" style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255,255,255,0.25);" title="Tout public"><i class="fas fa-users"></i> Tous</div>`;
        }
        
        card.innerHTML = `
            <div class="mini-card-header">
                <div class="mini-card-icon-wrapper" style="background: rgba(0,0,0,0.15); color: ${accent};">
                    <i class="${iconClass}"></i>
                </div>
                <div class="mini-card-actions">
                    <button class="edit-btn" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div class="mini-card-body">
                <h4 class="mini-card-title">${item.title || 'Annonce'}</h4>
                <p class="mini-card-desc">${item.description || ''}</p>
                <div class="media-badge-action">${actionLabel}</div>
            </div>
            <div class="mini-card-footer">
                ${playButtonHtml}
                ${audioIndicatorHtml}
                ${channelIndicatorHtml}
                <button class="mini-card-button" style="color: ${startColor}; border-color: ${accent};">${item.buttonLabel || 'Découvrir'}</button>
            </div>
        `;
        
        // Wire up play button
        const playBtn = card.querySelector('.mini-card-play-btn');
        if (playBtn) {
            playBtn.onclick = (e) => {
                e.stopPropagation();
                toggleAudioPlayback(item.audioUrl, playBtn);
            };
        }
        
        // Wire up edit button
        card.querySelector('.edit-btn').onclick = (e) => {
            e.stopPropagation();
            openMediaModal(item);
        };
        
        // Wire up delete button
        card.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            confirmDeleteAnnouncement(item);
        };
        
        grid.appendChild(card);
    });
}

// Scoped Audio Player
function toggleAudioPlayback(url, btn) {
    if (currentPreviewAudio && currentPreviewAudio.src === url) {
        if (!currentPreviewAudio.paused) {
            currentPreviewAudio.pause();
            btn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            currentPreviewAudio.play();
            btn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    } else {
        // Stop current
        stopAllAudioPreview();
        
        // Create new
        currentPreviewAudio = new Audio(url);
        currentPreviewButton = btn;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        currentPreviewAudio.oncanplay = () => {
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            currentPreviewAudio.play();
        };
        
        currentPreviewAudio.onended = () => {
            btn.innerHTML = '<i class="fas fa-play"></i>';
            currentPreviewAudio = null;
            currentPreviewButton = null;
        };
        
        currentPreviewAudio.onerror = () => {
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            window.showNotificationDrawer('Erreur Audio', 'Impossible de lire le fichier audio.', true);
            currentPreviewAudio = null;
            currentPreviewButton = null;
        };
    }
}

function stopAllAudioPreview() {
    if (currentPreviewAudio) {
        currentPreviewAudio.pause();
        if (currentPreviewButton) {
            currentPreviewButton.innerHTML = '<i class="fas fa-play"></i>';
        }
        currentPreviewAudio = null;
        currentPreviewButton = null;
    }
    if (modalPreviewAudio) {
        modalPreviewAudio.pause();
        const modalPlayBtn = document.getElementById('btnModalPlayAudio');
        if (modalPlayBtn) modalPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        modalPreviewAudio = null;
    }
}

// Category Chips click handler
document.querySelectorAll('#mediaCategoryFilters button').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('#mediaCategoryFilters button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMediaFilter = btn.getAttribute('data-media-filter');
        renderMediaHubGrid();
    };
});

// Modal Dialog Management
const mediaModal = document.getElementById('mediaCreateModal');
const mediaForm = document.getElementById('mediaForm');

document.getElementById('addAnnouncementBtn').onclick = () => {
    openMediaModal(null);
};

document.getElementById('closeMediaModal').onclick = () => {
    closeMediaModalWindow();
};

document.getElementById('btnCancelMedia').onclick = () => {
    closeMediaModalWindow();
};

function openMediaModal(item) {
    mediaForm.reset();
    stopAllAudioPreview();
    
    // Reset visual pickers
    document.querySelectorAll('#mediaIconSelector .icon-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('#mediaPresetsContainer .preset-gradient-option').forEach(opt => opt.classList.remove('selected'));
    
    // Set default visual choices
    document.querySelector('#mediaIconSelector .icon-option[data-icon="promo"]').classList.add('selected');
    document.querySelector('#mediaPresetsContainer .preset-gradient-option[data-start="#2C3E50"]').classList.add('selected');
    
    document.getElementById('mediaId').value = '';
    document.getElementById('mediaAudioUrl').value = '';
    document.getElementById('mediaAccentColor').value = '#ffffff';
    document.getElementById('mediaGradStart').value = '#2C3E50';
    document.getElementById('mediaGradEnd').value = '#3498DB';
    document.getElementById('mediaChannel').value = 'all';
    
    // Hide sub-containers
    document.getElementById('mediaTtsContainer').style.display = 'none';
    document.getElementById('mediaAudioFileContainer').style.display = 'none';
    document.getElementById('audioPreviewPlayer').style.display = 'none';
    document.getElementById('audioUploadStatus').style.display = 'none';
    
    if (item) {
        // Edit mode
        document.getElementById('mediaModalTitle').innerText = "Modifier l'Annonce";
        document.getElementById('mediaId').value = item.id;
        document.getElementById('mediaTitle').value = item.title || '';
        document.getElementById('mediaDescription').value = item.description || '';
        document.getElementById('mediaButtonLabel').value = item.buttonLabel || '';
        document.getElementById('mediaActionType').value = item.actionType || 'copy_promo';
        document.getElementById('mediaActionValue').value = item.actionValue || '';
        document.getElementById('mediaAccentColor').value = item.accentColor || '#ffffff';
        document.getElementById('mediaChannel').value = item.channel || 'all';
        
        if (item.gradientColors && item.gradientColors.length >= 2) {
            document.getElementById('mediaGradStart').value = item.gradientColors[0];
            document.getElementById('mediaGradEnd').value = item.gradientColors[1];
            
            // Try to match a preset
            let foundPreset = false;
            document.querySelectorAll('#mediaPresetsContainer .preset-gradient-option').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.getAttribute('data-start').toUpperCase() === item.gradientColors[0].toUpperCase() &&
                    opt.getAttribute('data-end').toUpperCase() === item.gradientColors[1].toUpperCase()) {
                    opt.classList.add('selected');
                    foundPreset = true;
                }
            });
        }
        
        // Set icon
        const iconOpt = document.querySelector(`#mediaIconSelector .icon-option[data-icon="${item.icon || 'promo'}"]`);
        if (iconOpt) {
            document.querySelectorAll('#mediaIconSelector .icon-option').forEach(opt => opt.classList.remove('selected'));
            iconOpt.classList.add('selected');
        }
        
        // Handle audio source
        if (item.audioUrl && item.audioUrl.trim() !== '') {
            document.querySelector('input[name="mediaAudioSource"][value="audio_file"]').checked = true;
            document.getElementById('mediaAudioFileContainer').style.display = 'block';
            document.getElementById('mediaAudioUrl').value = item.audioUrl;
            
            // Setup preview uploader
            document.getElementById('previewAudioName').innerText = item.audioUrl.substring(item.audioUrl.lastIndexOf('/') + 1);
            document.getElementById('previewAudioUrl').innerText = item.audioUrl;
            document.getElementById('audioPreviewPlayer').style.display = 'flex';
        } else if (item.speakText && item.speakText.trim() !== '') {
            document.querySelector('input[name="mediaAudioSource"][value="tts"]').checked = true;
            document.getElementById('mediaTtsContainer').style.display = 'block';
            document.getElementById('mediaSpeakText').value = item.speakText;
        } else {
            document.querySelector('input[name="mediaAudioSource"][value="none"]').checked = true;
        }
    } else {
        // Create mode
        document.getElementById('mediaModalTitle').innerText = "Ajouter une Annonce";
    }
    
    updateActionLabelAndPlaceholder();
    mediaModal.style.display = 'block';
}

function closeMediaModalWindow() {
    mediaModal.style.display = 'none';
    stopAllAudioPreview();
}

// Action type dropdown details updater
const actionTypeSelect = document.getElementById('mediaActionType');
const actionValueInput = document.getElementById('mediaActionValue');
const actionValueLabel = document.getElementById('mediaActionValueLabel');

actionTypeSelect.onchange = () => {
    updateActionLabelAndPlaceholder();
};

function updateActionLabelAndPlaceholder() {
    const val = actionTypeSelect.value;
    if (val === 'copy_promo') {
        actionValueLabel.innerText = "Valeur de l'Action (Code Promo)";
        actionValueInput.placeholder = "Ex: TRANSEN20";
        actionValueInput.required = true;
        actionValueInput.style.display = 'block';
    } else if (val === 'open_url') {
        actionValueLabel.innerText = "Valeur de l'Action (Lien URL)";
        actionValueInput.placeholder = "Ex: https://transen.org/special";
        actionValueInput.required = true;
        actionValueInput.style.display = 'block';
    } else {
        actionValueLabel.innerText = "Valeur de l'Action (Non requise)";
        actionValueInput.placeholder = "Aucune valeur requise pour cette action";
        actionValueInput.required = false;
        actionValueInput.value = '';
        actionValueInput.style.display = 'none';
    }
}

// Icon Selector Event
document.querySelectorAll('#mediaIconSelector .icon-option').forEach(opt => {
    opt.onclick = () => {
        document.querySelectorAll('#mediaIconSelector .icon-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
    };
});

// Gradient Presets Event
document.querySelectorAll('#mediaPresetsContainer .preset-gradient-option').forEach(opt => {
    opt.onclick = () => {
        document.querySelectorAll('#mediaPresetsContainer .preset-gradient-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        
        document.getElementById('mediaGradStart').value = opt.getAttribute('data-start');
        document.getElementById('mediaGradEnd').value = opt.getAttribute('data-end');
    };
});

// Sync gradient custom color pickers to deselect preset if they don't match
document.getElementById('mediaGradStart').onchange = deselectPresets;
document.getElementById('mediaGradEnd').onchange = deselectPresets;

function deselectPresets() {
    const start = document.getElementById('mediaGradStart').value.toUpperCase();
    const end = document.getElementById('mediaGradEnd').value.toUpperCase();
    
    document.querySelectorAll('#mediaPresetsContainer .preset-gradient-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-start').toUpperCase() === start && opt.getAttribute('data-end').toUpperCase() === end) {
            opt.classList.add('selected');
        }
    });
}

// Audio Source Toggle logic
document.querySelectorAll('input[name="mediaAudioSource"]').forEach(radio => {
    radio.onchange = () => {
        const val = radio.value;
        document.getElementById('mediaTtsContainer').style.display = (val === 'tts') ? 'block' : 'none';
        document.getElementById('mediaAudioFileContainer').style.display = (val === 'audio_file') ? 'block' : 'none';
        
        if (val !== 'tts') {
            document.getElementById('mediaSpeakText').value = '';
        }
        if (val !== 'audio_file') {
            document.getElementById('mediaAudioUrl').value = '';
            document.getElementById('audioPreviewPlayer').style.display = 'none';
            stopAllAudioPreview();
        }
    };
});

// Drag and Drop Audio Upload
const dropZone = document.getElementById('audioDropZone');
const fileInput = document.getElementById('audioFileInput');

dropZone.onclick = () => {
    fileInput.click();
};

fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
        handleAudioFileUpload(fileInput.files[0]);
    }
};

dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
};

dropZone.ondragleave = () => {
    dropZone.classList.remove('dragover');
};

dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleAudioFileUpload(e.dataTransfer.files[0]);
    }
};

function handleAudioFileUpload(file) {
    if (file.type !== 'audio/mp3' && file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
        window.showNotificationDrawer('Format Invalide', 'Veuillez sélectionner un fichier MP3 uniquement.', true);
        return;
    }
    
    if (file.size > 8 * 1024 * 1024) { // 8MB limit
        window.showNotificationDrawer('Fichier Trop Volumineux', 'La taille maximale autorisée est de 8 Mo.', true);
        return;
    }
    
    // Setup progress bar UI
    const progressStatus = document.getElementById('audioUploadStatus');
    const progressBar = document.getElementById('audioUploadProgress');
    const progressPercent = document.getElementById('audioUploadPercent');
    const uploadText = document.getElementById('audioUploadText');
    
    progressStatus.style.display = 'block';
    document.getElementById('audioPreviewPlayer').style.display = 'none';
    progressBar.style.width = '0%';
    progressPercent.innerText = '0%';
    uploadText.innerText = 'Envoi du fichier vers le stockage LWS...';
    
    // Upload using XHR to track progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_HOST}/api/admin/media/upload`);
    
    const token = localStorage.getItem('adminToken');
    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percent + '%';
            progressPercent.innerText = percent + '%';
        }
    };
    
    xhr.onload = () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                const fileUrl = response.url;
                
                document.getElementById('mediaAudioUrl').value = fileUrl;
                document.getElementById('previewAudioName').innerText = file.name;
                document.getElementById('previewAudioUrl').innerText = fileUrl;
                
                progressStatus.style.display = 'none';
                document.getElementById('audioPreviewPlayer').style.display = 'flex';
                window.showNotificationDrawer('Upload Réussi', 'Fichier audio téléchargé avec succès.', false);
            } catch (err) {
                console.error("Error parsing upload response:", err);
                uploadFailed("Réponse du serveur incorrecte.");
            }
        } else {
            let errMsg = "Erreur réseau";
            try {
                const response = JSON.parse(xhr.responseText);
                errMsg = response.error || errMsg;
            } catch (e) {}
            uploadFailed(errMsg);
        }
    };
    
    xhr.onerror = () => {
        uploadFailed("Impossible de contacter le serveur.");
    };
    
    xhr.send(formData);
}

function uploadFailed(message) {
    document.getElementById('audioUploadStatus').style.display = 'none';
    window.showNotificationDrawer('Échec de l\'Upload', message, true);
}

// Play Audio inside Modal preview
const btnModalPlayAudio = document.getElementById('btnModalPlayAudio');
btnModalPlayAudio.onclick = () => {
    const url = document.getElementById('mediaAudioUrl').value;
    if (!url) return;
    
    if (modalPreviewAudio) {
        if (!modalPreviewAudio.paused) {
            modalPreviewAudio.pause();
            btnModalPlayAudio.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            modalPreviewAudio.play();
            btnModalPlayAudio.innerHTML = '<i class="fas fa-pause"></i>';
        }
    } else {
        modalPreviewAudio = new Audio(url);
        btnModalPlayAudio.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        modalPreviewAudio.oncanplay = () => {
            btnModalPlayAudio.innerHTML = '<i class="fas fa-pause"></i>';
            modalPreviewAudio.play();
        };
        
        modalPreviewAudio.onended = () => {
            btnModalPlayAudio.innerHTML = '<i class="fas fa-play"></i>';
            modalPreviewAudio = null;
        };
        
        modalPreviewAudio.onerror = () => {
            btnModalPlayAudio.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            window.showNotificationDrawer('Erreur Lecture', 'Impossible de lire le fichier audio temporaire.', true);
            modalPreviewAudio = null;
        };
    }
};

// Delete Audio file within modal form
document.getElementById('btnDeleteAudioFile').onclick = () => {
    stopAllAudioPreview();
    document.getElementById('mediaAudioUrl').value = '';
    document.getElementById('audioPreviewPlayer').style.display = 'none';
    fileInput.value = '';
    window.showNotificationDrawer('Audio Supprimé', 'Le fichier audio a été détaché de l\'annonce.', false);
};

// Confirm and Delete announcement from Firestore
function confirmDeleteAnnouncement(item) {
    window.showConfirmDrawer(
        "Supprimer l'annonce",
        `Êtes-vous sûr de vouloir supprimer l'annonce "${item.title}" ?`,
        true,
        () => {
            stopAllAudioPreview();
            deleteDoc(doc(db, "announcements", item.id))
                .then(() => {
                    window.showNotificationDrawer('Annonce Supprimée', "L'annonce a été retirée du Hub Média.", false);
                })
                .catch(err => {
                    console.error("Error deleting announcement:", err);
                    window.showNotificationDrawer('Erreur', "Impossible de supprimer l'annonce.", true);
                });
        }
    );
}

// Save or Update Announcement in Firestore
document.getElementById('btnSaveMedia').onclick = async () => {
    const saveBtn = document.getElementById('btnSaveMedia');
    if (saveBtn && saveBtn.disabled) return;
    // Validate
    const title = document.getElementById('mediaTitle').value.trim();
    const description = document.getElementById('mediaDescription').value.trim();
    const buttonLabel = document.getElementById('mediaButtonLabel').value.trim();
    const actionType = document.getElementById('mediaActionType').value;
    const actionValue = document.getElementById('mediaActionValue').value.trim();
    const channel = document.getElementById('mediaChannel').value;
    
    if (!title || !description || !buttonLabel) {
        window.showNotificationDrawer('Validation', 'Veuillez remplir tous les champs obligatoires.', true);
        return;
    }
    
    if ((actionType === 'copy_promo' || actionType === 'open_url') && !actionValue) {
        window.showNotificationDrawer('Validation', 'La valeur de l\'action est requise pour ce type d\'action.', true);
        return;
    }
    
    const audioSource = document.querySelector('input[name="mediaAudioSource"]:checked').value;
    let audioUrl = "";
    let speakText = "";
    
    if (audioSource === 'audio_file') {
        audioUrl = document.getElementById('mediaAudioUrl').value.trim();
        if (!audioUrl) {
            window.showNotificationDrawer('Validation', 'Veuillez télécharger un fichier audio MP3.', true);
            return;
        }
    } else if (audioSource === 'tts') {
        speakText = document.getElementById('mediaSpeakText').value.trim();
        if (!speakText) {
            window.showNotificationDrawer('Validation', 'Veuillez saisir le texte pour la synthèse vocale (TTS).', true);
            return;
        }
    }
    
    const accentColor = document.getElementById('mediaAccentColor').value;
    const gradStart = document.getElementById('mediaGradStart').value;
    const gradEnd = document.getElementById('mediaGradEnd').value;
    const icon = document.querySelector('#mediaIconSelector .icon-option.selected').getAttribute('data-icon');
    
    const data = {
        title,
        description,
        buttonLabel,
        actionType,
        actionValue,
        accentColor,
        gradientColors: [gradStart, gradEnd],
        icon,
        audioUrl,
        speakText,
        channel,
        updatedAt: new Date().toISOString()
    };
    
    const mediaId = document.getElementById('mediaId').value;
    await _runLockedAction(saveBtn, async () => {
        try {
            stopAllAudioPreview();
            if (mediaId) {
                await updateDoc(doc(db, "announcements", mediaId), data);
                window.showNotificationDrawer('Annonce Modifiée', "L'annonce a été mise à jour avec succès.", false);
            } else {
                data.createdAt = new Date().toISOString();
                await addDoc(collection(db, "announcements"), data);
                window.showNotificationDrawer('Annonce Créée', 'Nouvelle annonce publiée dans le Hub Média.', false);
            }
            closeMediaModalWindow();
        } catch (err) {
            console.error("Error saving announcement:", err);
            window.showNotificationDrawer('Erreur Firestore', "Impossible d'enregistrer l'annonce.", true);
        }
    });
};


