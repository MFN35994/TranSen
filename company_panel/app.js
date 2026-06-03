const API_BASE_URL = 'https://api.transen.org'; // The Spring Boot backend

let currentCompanyId = null;
let currentToken = null;

// Initialiser l'état au chargement
window.onload = () => {
    const token = localStorage.getItem('transen_company_token');
    const companyId = localStorage.getItem('transen_company_id');
    if (token && companyId) {
        currentToken = token;
        currentCompanyId = companyId;
        const companyName = localStorage.getItem('transen_company_name');
        const companyCode = localStorage.getItem('transen_company_code');
        showApp({ name: companyName, companyCode: companyCode });
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
            document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
            document.getElementById(`section-${section}`).style.display = 'block';
            document.querySelectorAll('#mainNav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('sectionTitle').innerText = link.innerText;
        };
    });
}

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
        window.location.reload();
    }
    return response.json();
}

async function loadDashboardData() {
    if (!currentCompanyId) return;

    try {
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
        driversTbody.innerHTML = "";
        if (drivers.length === 0) {
            driversTbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Aucun chauffeur. Donnez votre Code de Recrutement !</td></tr>`;
        } else {
            drivers.forEach(d => {
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
            });
        }

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

    } catch (error) {
        console.error("Erreur chargement données API", error);
    }
}
