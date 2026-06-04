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
            backgroundColor: null // Transparent or default
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
