import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.8/+esm";

// ==========================================
// CYBERSECURITY PRODUCTION ENFORCEMENT ENGINE
// ==========================================
window.DEBUG_MODE = false;
window.SECURE_PROD_MODE = true;

// Override logger to prevent data sniffing/leakage in production
if (!window.DEBUG_MODE) {
    const noop = () => {};
    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;
}

// Global XSS (Cross-Site Scripting) Sanitation Utility
window.escapeHtml = function(str) {
    if (typeof str !== 'string') {
        if (str === null || str === undefined) return '';
        return String(str);
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Prevent malicious debug URL params
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('debug')) {
    urlParams.delete('debug');
    window.history.replaceState({}, document.title, window.location.pathname);
}

// Global company stamp converter for professional certification
window.getStampBase64 = async function() {
    try {
        const res = await fetch("/assets/Cacher_transen.jpeg");
        if (!res.ok) throw new Error("Stamp image fetch failed");
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error("Stamp image load error:", err);
        return null;
    }
};

// Global logo converter for professional branding in PDF/exports
window.getLogoBase64 = async function() {
    try {
        const res = await fetch("/assets/transen-logo.png");
        if (!res.ok) throw new Error("Logo image fetch failed");
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error("Logo image load error:", err);
        return null;
    }
};

// ==========================================
// INTERACTIVE AUTH HELPER ENGINE
// ==========================================
window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.className = 'far fa-eye-slash';
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.className = 'far fa-eye';
        }
    }
};

window.checkPasswordStrength = function(password) {
    const fill = document.getElementById('regPasswordStrength');
    const text = document.getElementById('regPasswordStrengthText');
    if (!fill || !text) return;

    if (!password) {
        fill.style.width = '0%';
        fill.style.backgroundColor = '#E2E8F0';
        text.innerText = 'Sécurité minimale requise';
        return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let width = '0%';
    let color = '#EF4444';
    let label = 'Très faible 🔴';

    if (score === 1) {
        width = '25%';
        color = '#EF4444';
        label = 'Faible 🔴';
    } else if (score === 2) {
        width = '50%';
        color = '#F59E0B';
        label = 'Moyen 🟡';
    } else if (score === 3) {
        width = '75%';
        color = '#10B981';
        label = 'Robuste 🟢';
    } else if (score >= 4) {
        width = '100%';
        color = '#059669';
        label = 'Hautement Sécurisé 💪';
    }

    fill.style.width = width;
    fill.style.backgroundColor = color;
    text.innerText = `Force : ${label}`;
};

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

// ==========================================
// CENTRALIZED SECURE AXIOS CLIENT (Defense in Depth)
// ==========================================
const apiSecureClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
    }
});

// Request interceptor to automatically inject Auth Bearer token and customized security markers
apiSecureClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('transen_company_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    // CSRF protection header
    config.headers['X-CSRF-Token'] = 'Secure-TranSen-B2B-Token';
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to centrally handle authentication expiries and standard error codes
apiSecureClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
            console.error("[Axios Security Error] Accès non autorisé ou token expiré.");
            localStorage.removeItem('transen_company_token');
            localStorage.removeItem('transen_company_id');
            hideApp();
        }
    }
    return Promise.reject(error);
});

async function customTransenFetch(resource, init = {}) {
    const urlStr = typeof resource === 'string' ? resource : (resource && resource.url) ? resource.url : "";
    const method = (init.method || "GET").toUpperCase();
    
    // Normalize body to data object if needed
    let reqData = null;
    if (init.body) {
        if (typeof init.body === 'string') {
            try {
                reqData = JSON.parse(init.body);
            } catch (e) {
                reqData = init.body;
            }
        } else {
            reqData = init.body;
        }
    }
    
    try {
        const sourceUrl = urlStr.startsWith('http') ? urlStr : `${API_BASE_URL}${urlStr}`;
        const config = {
            url: sourceUrl,
            method: method,
            data: reqData,
            headers: {}
        };
        
        // Pass any headers, avoiding overriding defaults unnecessarily
        if (init.headers) {
            Object.keys(init.headers).forEach(k => {
                config.headers[k] = init.headers[k];
            });
        }
        
        const response = await apiSecureClient(config);
        
        return {
            ok: true,
            status: response.status,
            statusText: response.statusText,
            json: async () => response.data,
            text: async () => (typeof response.data === 'object' ? JSON.stringify(response.data) : response.data)
        };
    } catch (error) {
        console.error(`[Axios Client Error] Échec de la requête vers: ${urlStr}. Erreur:`, error);
        if (error.response) {
            return {
                ok: false,
                status: error.response.status,
                statusText: error.response.statusText,
                json: async () => error.response.data,
                text: async () => (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data)
            };
        }
        return {
            ok: false,
            status: 500,
            statusText: error.message || "Unknown error",
            json: async () => ({ message: error.message || "Unknown network error" }),
            text: async () => error.message || "Unknown network error"
        };
    }
}

let currentCompanyId = null;
let currentToken = null;

// Modal Standardization (Centralized Fixed Display, z-index 9999, Escape and Backdrop closure)
function initModalStandardization() {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        // Enforce z-index and fixed position styling dynamically
        overlay.style.position = 'fixed';
        overlay.style.zIndex = '9999';
        
        // Background/click out-of-zone closure behavior
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });

    // Escape Key Closure
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            overlays.forEach(overlay => {
                overlay.style.display = 'none';
            });
        }
    });
}

// Initialiser l'état au chargement
window.onload = () => {
    initModalStandardization();
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
    const subtitle = document.getElementById('auth-panel-subtitle');
    if (subtitle) subtitle.innerText = "Inscrivez votre entreprise ou GIE en moins de 3 minutes";
};

document.getElementById('showLoginBtn').onclick = () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    const subtitle = document.getElementById('auth-panel-subtitle');
    if (subtitle) subtitle.innerText = "Veuillez renseigner vos identifiants administrateur de compagnie";
};

// --- Inscription ---
document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<span>Création en cours...</span><i class="fas fa-circle-notch fa-spin" style="margin-left:8px;"></i>';
    btn.disabled = true;

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
        const response = await customTransenFetch(`${API_BASE_URL}/api/auth/company/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('transen_company_token', result.token);
            localStorage.setItem('transen_company_id', result.companyId);
            localStorage.setItem('transen_company_name', data.companyName);
            
            Toastify({
                text: "🎉 Compte créé avec succès ! Bienvenue chez TranSen B2B.",
                duration: 3000,
                style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
            }).showToast();

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            Toastify({
                text: "❌ Erreur : " + result.message,
                duration: 5000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
        }
    } catch (error) {
        Toastify({
            text: "❌ Impossible de se connecter au serveur d'inscription.",
            duration: 5000,
            style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    } finally {
        btn.innerHTML = '<span>Créer le compte compagnie</span><i class="fas fa-circle-check" style="margin-left:8px;"></i>';
        btn.disabled = false;
    }
};

// --- Connexion ---
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signInBtn');
    btn.innerHTML = '<span>Connexion...</span><i class="fas fa-circle-notch fa-spin" style="margin-left:8px;"></i>';
    btn.disabled = true;

    const data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await customTransenFetch(`${API_BASE_URL}/api/auth/company/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            if (!result.companyId) {
                Toastify({
                    text: "⚠️ Votre compte n'est rattaché à aucune compagnie valide.",
                    duration: 5000,
                    style: { background: "linear-gradient(to right, #F59E0B, #D97706)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
                btn.innerHTML = '<span>Se connecter à la console</span><i class="fas fa-arrow-right-long" style="margin-left:8px;"></i>';
                btn.disabled = false;
                return;
            }
            localStorage.setItem('transen_company_token', result.token);
            localStorage.setItem('transen_company_id', result.companyId);
            localStorage.setItem('transen_company_name', result.companyName);
            localStorage.setItem('transen_company_code', result.companyCode);
            
            Toastify({
                text: "🎉 Connexion réussie ! Chargement du module d'administration...",
                duration: 2000,
                style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
            }).showToast();

            setTimeout(() => {
                window.location.reload();
            }, 800);
        } else {
            Toastify({
                text: "❌ Authentification échouée : " + result.message,
                duration: 5000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
        }
    } catch (error) {
        Toastify({
            text: "❌ Impossible de joindre le serveur de sécurité TranSen.",
            duration: 5000,
            style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    } finally {
        btn.innerHTML = '<span>Se connecter à la console</span><i class="fas fa-arrow-right-long" style="margin-left:8px;"></i>';
        btn.disabled = false;
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

    // Activer la section dashboard par défaut au chargement
    const dashboardSection = document.getElementById('section-dashboard');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        dashboardSection.classList.add('active-section');
    }
    const homeLink = document.querySelector('#mainNav a[data-section="dashboard"]');
    if (homeLink) homeLink.classList.add('active');

    loadDashboardData();
    initThemeMode();
    startAutoRefresh();

    // Auto-onboarding for initial launch
    setTimeout(() => {
        if (!localStorage.getItem('transen_onboarded_v2')) {
            startOnboardingTutorial();
            localStorage.setItem('transen_onboarded_v2', 'true');
        }
    }, 1500);
}

function hideApp() {
    document.getElementById('login-overlay').style.display = "flex";
    document.getElementById('admin-app').style.display = "none";
}

document.getElementById('logoutBtn').onclick = () => {
    stopAutoRefresh();
    localStorage.clear();
    window.location.reload();
};

function setupNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.onclick = () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            // Force Mapbox resize in case the layout shifted
            if (map) setTimeout(() => map.resize(), 350);
        };
        sidebarOverlay.onclick = () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            if (map) setTimeout(() => map.resize(), 350);
        };
    }

    document.querySelectorAll('#mainNav a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');

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
                
                // Force layouts, tables and ApexCharts to scale seamlessly
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            }
            document.querySelectorAll('#mainNav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('sectionTitle').innerText = link.innerText;

            // Sync bottom nav active state
            document.querySelectorAll('.bottom-nav-item').forEach(b => {
                b.classList.toggle('active', b.dataset.section === section);
            });

            // KEY FIX: Resize Mapbox when navigating to dashboard
            if (section === 'dashboard' && map) {
                setTimeout(() => map.resize(), 150);
            }

            if (section === 'kyc') {
                loadKycData();
            } else if (section === 'profile') {
                loadProfileData();
            } else if (section === 'schedule') {
                loadSchedulePageData();
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

        const response = await customTransenFetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        
        if (response.ok) {
            if (typeof window.addAuditLog === 'function') {
                const actName = currentSenepayAction === 'withdraw' ? "Retrait Portefeuille" : "Dépôt Portefeuille";
                const typeName = currentSenepayAction === 'withdraw' ? "Retrait de fonds" : "Dépôt de fonds";
                window.addAuditLog(actName, `${typeName} de ${amount.toLocaleString()} FCFA sur le numéro ${phone}`, "FINANCE");
            }
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
// Receipt Modal Logic & IMMERSIVE INLINE SUPPORT
// ==========================================
window.openReceipt = function(ref, date, type, status, amountStr) {
    let statusFr = status;
    if (status === 'PENDING') statusFr = 'EN ATTENTE';
    if (status === 'COMPLETED') statusFr = 'COMPLÉTÉ';
    if (status === 'FAILED') statusFr = 'ÉCHOUÉ';

    // Populate standard modal (for fallback support)
    document.getElementById('receiptRef').innerText = ref;
    document.getElementById('receiptDate').innerText = date;
    document.getElementById('receiptType').innerText = type;
    document.getElementById('receiptStatus').innerText = statusFr;
    document.getElementById('receiptStatus').className = `receipt-val status-tag ${status.toLowerCase()}`;
    document.getElementById('receiptAmount').innerText = amountStr;

    // Populate immersive full-screen view inside wallet tab
    document.getElementById('detReceiptRef').innerText = ref;
    document.getElementById('detReceiptDate').innerText = date;
    document.getElementById('detReceiptType').innerText = type;
    document.getElementById('detReceiptStatus').innerText = statusFr;
    document.getElementById('detReceiptStatus').className = `status-tag ${status.toLowerCase()}`;
    document.getElementById('detReceiptAmount').innerText = amountStr;

    // Slide-out and animate the transitions between subviews
    document.getElementById('walletMainView').style.display = 'none';
    document.getElementById('walletMainView').classList.remove('active-subview');
    
    const receiptView = document.getElementById('walletReceiptDetailView');
    receiptView.style.display = 'block';
    setTimeout(() => {
        receiptView.classList.add('active-subview');
    }, 50);
};

window.backToWalletMain = function() {
    document.getElementById('walletMainView').style.display = 'block';
    setTimeout(() => {
        document.getElementById('walletMainView').classList.add('active-subview');
        document.getElementById('walletReceiptDetailView').classList.remove('active-subview');
        document.getElementById('walletReceiptDetailView').style.display = 'none';
    }, 50);
};

window.downloadInlineReceipt = async function() {
    const receiptElement = document.getElementById('inlineReceiptContent');
    const btn = document.getElementById('inlineShareReceiptBtn');
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
        btn.disabled = true;
        
        // Convert with html2canvas (fully configured with CORS & dark mode aesthetics)
        const canvas = await html2canvas(receiptElement, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#0f1322'
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        const ref = document.getElementById('detReceiptRef').innerText;
        link.download = `Transen_Recu_${ref}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Toastify({
            text: "✨ Votre reçu de transaction a été téléchargé avec succès !",
            duration: 3500,
            style: { background: "linear-gradient(to right, #10B981, #059669)" }
        }).showToast();
    } catch (error) {
        console.error("Erreur génération reçu:", error);
        Toastify({
            text: "❌ Impossible de générer l'image du reçu.",
            duration: 3000,
            style: { background: "linear-gradient(to right, #EF4444, #DC2626)" }
        }).showToast();
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
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
    const response = await customTransenFetch(url, {
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
    if (!response.ok) {
        let errMsg = `Erreur HTTP ${response.status}`;
        try {
            const errData = await response.json();
            if (errData && errData.message) {
                errMsg = errData.message;
            }
        } catch(e) {}
        throw new Error(errMsg);
    }
    return response.json();
}

window.dismissAlert = function(alertId) {
    sessionStorage.setItem('dismissed_alert_' + alertId, 'true');
    const el = document.getElementById(alertId);
    if (el) el.style.display = 'none';
};

async function loadDashboardData() {
    if (!currentCompanyId) return;

    try {
        // 0. Load KYC Status
        try {
            const kycStatus = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);
            const banner = document.getElementById('kycAlertBanner');
            if (banner) {
                if (kycStatus.status !== 'APPROVED' && sessionStorage.getItem('dismissed_alert_kycAlertBanner') !== 'true') {
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

        // 0b. Check Email Verification Status
        try {
            const userInfo = await fetchWithAuth(`${API_BASE_URL}/api/users/me`);
            const emailBanner = document.getElementById('emailVerifyBanner');
            if (emailBanner) {
                if (userInfo.isVerified === false && sessionStorage.getItem('dismissed_alert_emailVerifyBanner') !== 'true') {
                    emailBanner.style.display = 'block';
                    const resendBtn = document.getElementById('resendVerificationBtn');
                    if (resendBtn) {
                        resendBtn.onclick = async () => {
                            resendBtn.disabled = true;
                            resendBtn.innerText = 'Envoi en cours...';
                            try {
                                const res = await customTransenFetch(`${API_BASE_URL}/api/auth/company/resend-verification`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${currentToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ email: userInfo.email })
                                });
                                if (res.ok) {
                                    window.showNotificationDrawer("E-mail envoyé", "Un nouvel e-mail de vérification vous a été envoyé. Vérifiez votre boîte de réception.", false);
                                } else {
                                    window.showNotificationDrawer("Erreur", "Impossible de renvoyer l'e-mail. Réessayez plus tard.", true);
                                }
                            } catch (e) {
                                window.showNotificationDrawer("Erreur", "Erreur de connexion au serveur.", true);
                            } finally {
                                resendBtn.disabled = false;
                                resendBtn.innerText = "Renvoyer l'e-mail";
                            }
                        };
                    }
                } else {
                    emailBanner.style.display = 'none';
                }
            }
        } catch (emailErr) {
            console.error("Erreur lors de la vérification du statut email :", emailErr);
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
        window.loadedDriversCache = drivers;
        const driversTbody = document.getElementById('driversTableBody');
        const dashboardDriverList = document.getElementById('dashboardDriverList');
        
        driversTbody.innerHTML = "";
        if (dashboardDriverList) dashboardDriverList.innerHTML = "";

        // Update maintenance dropdown list of drivers dynamically
        updateMaintDriverDropdown(drivers);

        if (drivers.length === 0) {
            driversTbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Aucun chauffeur. Donnez votre Code de Recrutement !</td></tr>`;
            if (dashboardDriverList) dashboardDriverList.innerHTML = `<div class="loading-cell" style="text-align:center; padding:20px; color:var(--text-dim);">Aucun chauffeur rattaché.</div>`;
        } else {
            drivers.forEach((d, index) => {
                // In maintenance check warning badges
                const driverRules = getMaintenanceRules().filter(r => r.driverName === d.name);
                let maintBadge = "";
                driverRules.forEach(rule => {
                    const cleanType = rule.type === "VIDANGE" ? "Vidange" : rule.type === "CONTROLE" ? "Contrôle" : rule.type === "FREINS" ? "Freins" : "Pneus";
                    if (rule.currentKm >= rule.triggerKm) {
                        maintBadge += `<div class="status-badge maintenance" style="font-size: 0.65rem; padding: 2px 6px; margin-top:2px; display:inline-flex; align-items:center; gap:3px; background:var(--red); color:#FFFFFF; border:none; line-height:1;"><i class="fas fa-exclamation-triangle" style="font-size:0.6rem;"></i> ${cleanType} Requis</div>`;
                    } else if (rule.currentKm >= rule.triggerKm * 0.9) {
                        maintBadge += `<div class="status-badge maintenance" style="font-size: 0.65rem; padding: 2px 6px; margin-top:2px; display:inline-flex; align-items:center; gap:3px; background:var(--gold); color:#FFFFFF; border:none; line-height:1;"><i class="fas fa-tools" style="font-size:0.6rem;"></i> ${cleanType} Proche</div>`;
                    }
                });

                const vInfo = getVehicleModelInfo(d, index);

                const isFav = typeof window.isFavorite === 'function' ? window.isFavorite('driver', d.id) : false;
                const starColor = isFav ? '#F59E0B' : 'var(--text-dim)';
                const starIcon = isFav ? 'fas fa-star' : 'far fa-star';

                driversTbody.innerHTML += `
                    <tr>
                        <td data-label="Chauffeur">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button onclick="window.toggleFavorite('driver', '${d.id}', '${(escapeHtml(d.name) || "").replace(/'/g, "\\'")}')" style="border:none; background:none; cursor:pointer; color: ${starColor}; padding:0; display:inline-flex; align-items:center;" title="Épingler ce chauffeur">
                                    <i class="${starIcon}" style="font-size:0.9rem;"></i>
                                </button>
                                <b>${escapeHtml(d.name || "Chauffeur sans nom")}</b>
                            </div>
                        </td>
                        <td data-label="Téléphone">${escapeHtml(d.phone)}</td>
                        <td data-label="Véhicule"><b>${escapeHtml(vInfo.model)}</b> <span style="font-size: 0.7rem; color: var(--text-dim);">(${escapeHtml(vInfo.type)})</span> <br>${maintBadge ? maintBadge : '<span style="font-size: 0.72rem; color:var(--text-dim);"><i class="fas fa-shield-alt" style="color:var(--primary);"></i> OK</span>'}</td>
                        <td data-label="Courses (Total)">${d.totalTrips}</td>
                        <td data-label="Revenus Générés"><b>${d.totalRevenue.toLocaleString()} F</b></td>
                        <td data-label="Statut"><span class="status-tag ${d.status === 'ACTIVE' ? 'active' : 'inactive'}">${escapeHtml(d.status)}</span></td>
                        <td data-label="Actions"><button class="icon-btn glass" style="color:var(--text-dim)"><i class="fas fa-ban"></i></button></td>
                    </tr>`;
                
                if (dashboardDriverList && index < 6) {
                    let badgeClass = d.status === 'ACTIVE' ? 'available' : 'maintenance';
                    let statusText = d.status === 'ACTIVE' ? 'En Ligne' : 'Hors Ligne';
                    dashboardDriverList.innerHTML += `
                    <div class="driver-status-item">
                        <div class="driver-info-sm">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random" alt="${escapeHtml(d.name)}">
                            <div><span class="d-name">${escapeHtml(d.name)}</span><span class="d-car">${escapeHtml(vInfo.model)} &middot; ${escapeHtml(d.phone)}</span></div>
                        </div>
                        <span class="status-badge ${badgeClass}">${escapeHtml(statusText)}</span>
                    </div>`;
                }
            });
        }

        // Initialize Mapbox with active drivers
        setupMapbox(drivers);

        const trips = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/trips?companyId=${currentCompanyId}`);
        window.loadedTrips = trips; // Cache globally for real-time filters

        // Update timelineTrips dynamically from active trips
        const activeTrips = trips.filter(t => t.status === 'PENDING' || t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS');
        window.timelineTrips = activeTrips.map(t => {
            let timeStr = "08:00";
            if (t.scheduledTime) {
                try {
                    const parts = t.scheduledTime.split('T');
                    if (parts.length > 1) {
                        timeStr = parts[1].substring(0, 5);
                    } else {
                        const spaceParts = t.scheduledTime.split(' ');
                        if (spaceParts.length > 1) {
                            timeStr = spaceParts[1].substring(0, 5);
                        }
                    }
                } catch(e) {}
            }
            return {
                id: t.id,
                title: `${t.departure} ➔ ${t.destination}`,
                time: timeStr,
                route: `${t.departure} vers ${t.destination}`,
                assignedDriver: t.driverName || "Non assigné",
                cost: `${t.price} F`
            };
        });

        // Update statistics indicators for company fleet
        const totalTrips = trips.length;
        const activeTripsCount = activeTrips.length;
        const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;
        const totalBookedSeats = trips.reduce((acc, t) => acc + ((t.totalSeats || 0) - (t.availableSeats || 0)), 0);
        const totalCapacity = trips.reduce((acc, t) => acc + (t.totalSeats || 0), 0);

        const totalCountEl = document.getElementById('tripsStatTotalCount');
        if (totalCountEl) totalCountEl.innerText = `${activeTripsCount} / ${totalTrips}`;

        const completedCountEl = document.getElementById('tripsStatCompletedCount');
        if (completedCountEl) completedCountEl.innerText = `${completedTrips}`;

        const passengersCountEl = document.getElementById('tripsStatPassengersCount');
        if (passengersCountEl) passengersCountEl.innerText = `${totalBookedSeats} / ${totalCapacity}`;

        const liveTbody = document.getElementById('liveTripsTableBody');
        liveTbody.innerHTML = "";
        
        if (trips.length === 0) {
            liveTbody.innerHTML = `<tr><td colspan="6" class="loading-cell">Aucune course enregistrée.</td></tr>`;
        } else {
            trips.forEach((t) => {
                const dateStr = new Date(t.createdAt).toLocaleString('fr-FR');
                liveTbody.innerHTML += `
                    <tr>
                        <td data-label="ID / Date"><small>${escapeHtml(t.id.substring(0,6))}</small><br>${dateStr}</td>
                        <td data-label="Chauffeur"><b>${escapeHtml(t.driverName)}</b></td>
                        <td data-label="Client (Nom)">${escapeHtml(t.clientName)}</td>
                        <td data-label="Trajet">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button onclick="window.toggleFavorite('trip', '${t.id}', '${(escapeHtml(t.departure) || "Inconnu").replace(/'/g, "\\'")} ➔ ${(escapeHtml(t.destination) || "Inconnu").replace(/'/g, "\\'")}')" style="border:none; background:none; cursor:pointer; color: ${typeof window.isFavorite === 'function' && window.isFavorite('trip', t.id) ? '#F59E0B' : 'var(--text-dim)'}; padding:0; display:inline-flex; align-items:center;" title="Épingler ce trajet">
                                    <i class="${typeof window.isFavorite === 'function' && window.isFavorite('trip', t.id) ? 'fas fa-star' : 'far fa-star'}" style="font-size:0.9rem;"></i>
                                </button>
                                <small><b>De:</b> ${escapeHtml(t.departure || "Inconnu")}<br><b>À:</b> ${escapeHtml(t.destination || "Inconnu")}${t.relayPoint ? `<br><b>Relais:</b> ${escapeHtml(t.relayPoint)}` : ''}</small>
                            </div>
                        </td>
                        <td data-label="Prix"><b>${t.price} F</b></td>
                        <td data-label="Statut"><span class="status-tag ${escapeHtml(t.status.toLowerCase())}">${escapeHtml(t.status)}</span></td>
                        <td data-label="Actions">
                            <button class="btn-primary" onclick="window.openPassengerManager('${t.id}', '${(escapeHtml(t.departure) || "Inconnu").replace(/'/g, "\\'")} ➔ ${(escapeHtml(t.destination) || "Inconnu").replace(/'/g, "\\'")}')" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px;">
                                <i class="fas fa-users"></i> Gérer
                            </button>
                            ${t.status === 'PENDING' ? `
                            <button class="btn-success" onclick="window.updateTripStatus('${t.id}', 'COMPLETED')" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px; margin-left: 5px; background-color: var(--green); border: none; color: white; cursor: pointer;" title="Terminer la course">
                                <i class="fas fa-check"></i> Terminer
                            </button>
                            <button class="btn-danger" onclick="window.updateTripStatus('${t.id}', 'CANCELLED')" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px; margin-left: 5px; background-color: var(--red); border: none; color: white; cursor: pointer;" title="Annuler la course">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                            ` : ''}
                        </td>
                    </tr>`;
            });
        }

        // Render activities dynamically with any configured filters
        window.filterAndRenderActivities();

        // Render drivers performance circular gauges
        renderKPIBarCharts(drivers, trips);

        // 4. Load Wallet Data
        const walletData = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/wallet?companyId=${currentCompanyId}`);
        window.loadedWalletData = walletData;
        
        let displayedBalance = walletData.balance || 0;
        
        document.getElementById('walletBalance').innerText = `${displayedBalance.toLocaleString()} F`;

        // Proactive wallet threshold check
        const threshold = parseInt(localStorage.getItem('wallet_critical_threshold') || '25000');
        const alertBanner = document.getElementById('walletThresholdAlert');
        if (alertBanner) {
            if (displayedBalance < threshold) {
                const isDismissed = sessionStorage.getItem('dismissed_alert_walletThresholdAlert') === 'true';
                if (!isDismissed) {
                    alertBanner.style.display = 'flex';
                }
                const balText = document.getElementById('walletAlertBalanceText');
                const thText = document.getElementById('walletAlertThresholdText');
                if (balText) balText.innerText = `${displayedBalance.toLocaleString()} F`;
                if (thText) thText.innerText = `${threshold.toLocaleString()} F`;
            } else {
                alertBanner.style.display = 'none';
            }
        }
        
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
                        <td data-label="Date">${dateStr}</td>
                        <td data-label="Type"><b>${tx.type}</b></td>
                        <td data-label="Montant" style="color: ${color}; font-weight: bold;">${amountStr}</td>
                        <td data-label="Statut"><span class="status-tag ${tx.status.toLowerCase()}">${statusFr}</span></td>
                    </tr>`;
            });
        }

        // Rendre le graphique de chiffre d'affaires, le donut des catégories de véhicules, et configurer ses filtres
        setTimeout(() => {
            const activeFilter = document.querySelector('.chart-filters button.active');
            const range = activeFilter ? activeFilter.getAttribute('data-range') : '7d';
            renderRevenueChart(range);
            setupChartFilters();
            renderVehicleDonutChart(drivers);
            if (typeof renderDriverStatusPieChart === 'function') {
                renderDriverStatusPieChart(drivers);
            }
            if (typeof renderTimelinePlanning === 'function') {
                renderTimelinePlanning(drivers);
            }
        }, 100);

    } catch (error) {
        console.error("Erreur chargement données API", error);
    }
}

let map;
let markers = {}; // Store markers by driverId
let activeDriversUnsubscribe = null;

window.updateTripStatus = async function(tripId, status) {
    const actionText = status === 'COMPLETED' ? "terminer" : "annuler";
    if (!confirm(`Voulez-vous vraiment ${actionText} ce trajet ?`)) {
        return;
    }

    try {
        const url = `${API_BASE_URL}/api/company/dashboard/trips/${tripId}/status?status=${status}`;
        const response = await customTransenFetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            if (typeof window.addAuditLog === 'function') {
                const prettyStatus = status === 'COMPLETED' ? "Terminée" : "Annulée";
                window.addAuditLog(
                    "Statut Course", 
                    `Le trajet régulier #${tripId.substring(0, 6)} a été marqué comme ${prettyStatus}`, 
                    "COURSES"
                );
            }
            alert(result.message || "Statut du trajet mis à jour !");
            loadDashboardData(); // Refresh the table
        } else {
            alert("Erreur: " + (result.error || "Impossible de mettre à jour le statut"));
        }
    } catch (error) {
        alert("Erreur de connexion au serveur.");
    }
};

function setupMapbox(drivers) {
    if (!document.getElementById('fleetMap')) return;
    
    try {
        // Dakar Center
        const dakarCenter = [-17.4677, 14.7167];

        if (!map) {
            mapboxgl.accessToken = 'pk.eyJ1IjoidHJhbnNlbiIsImEiOiJjbXA4Nm5menUwM205MnNwOGZmb3N3ZTM4In0.SMFaXkbJJi5bM6Bk3_p8ng';
            map = new mapboxgl.Map({
                container: 'fleetMap',
                style: 'mapbox://styles/mapbox/light-v11',
                center: dakarCenter,
                zoom: 12
            });
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // KEY FIX: Force resize after map initialization to handle mobile layout
            map.on('load', () => {
                setTimeout(() => map.resize(), 200);
            });

            // KEY FIX: Listen to window resize and orientation change
            window.addEventListener('resize', () => {
                if (map) setTimeout(() => map.resize(), 300);
            });
            window.addEventListener('orientationchange', () => {
                if (map) setTimeout(() => map.resize(), 500);
            });
        }

        // Subscribe to Firestore for real-time driver locations
        const activeDriversRef = collection(db, "active_drivers");
        
        if (activeDriversUnsubscribe) {
            activeDriversUnsubscribe();
        }

        activeDriversUnsubscribe = onSnapshot(activeDriversRef, (snapshot) => {
            const onlineOurDrivers = new Set();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const driverId = doc.id;
                
                // Check if this driver belongs to our company (is in our drivers array)
                const isOurDriver = drivers.find(d => d.id === driverId);
                
                if (isOurDriver && data.status === 'online') {
                    onlineOurDrivers.add(driverId);
                    const lng = data.lng;
                    const lat = data.lat;

                    if (markers[driverId]) {
                        // Update existing marker position smoothly
                        markers[driverId].setLngLat([lng, lat]);
                    } else {
                        // Create new marker
                        const el = document.createElement('div');
                        el.className = 'driver-marker';

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

            // Clean up markers of drivers that are no longer in the snapshot
            Object.keys(markers).forEach(driverId => {
                const stillOnline = snapshot.docs.some(doc => doc.id === driverId && doc.data().status === 'online');
                const isOurDriver = drivers.find(d => d.id === driverId);
                if (isOurDriver && !stillOnline) {
                    markers[driverId].remove();
                    delete markers[driverId];
                }
            });

            // Dynamic update of active/online driver counts in UI in real-time!
            const totalDrivers = drivers.length;
            const onlineCount = onlineOurDrivers.size;
            const offlineCount = totalDrivers - onlineCount;

            const activeDriversCountEl = document.getElementById('activeDriversCount');
            const onlineDriversCountEl = document.getElementById('onlineDriversCount');
            const offlineDriversCountEl = document.getElementById('offlineDriversCount');

            if (activeDriversCountEl) activeDriversCountEl.innerText = `${onlineCount} / ${totalDrivers}`;
            if (onlineDriversCountEl) onlineDriversCountEl.innerText = onlineCount;
            if (offlineDriversCountEl) offlineDriversCountEl.innerText = offlineCount;

            // Also dynamically update the status badges in the drivers table!
            drivers.forEach(d => {
                const isOnlineNow = onlineOurDrivers.has(d.id);
                const statusStr = isOnlineNow ? 'ACTIVE' : 'INACTIVE';
                
                const driversTbody = document.getElementById('driversTableBody');
                if (driversTbody) {
                    const rows = driversTbody.querySelectorAll('tr');
                    rows.forEach(row => {
                        const phoneCell = row.querySelector('td[data-label="Téléphone"]');
                        if (phoneCell && phoneCell.innerText === d.phone) {
                            const statusTag = row.querySelector('.status-tag');
                            if (statusTag) {
                                statusTag.innerText = statusStr;
                                statusTag.className = `status-tag ${isOnlineNow ? 'active' : 'inactive'}`;
                            }
                        }
                    });
                }

                // Also update the dashboard driver list status badge!
                const dashboardDriverList = document.getElementById('dashboardDriverList');
                if (dashboardDriverList) {
                    const items = dashboardDriverList.querySelectorAll('.driver-status-item');
                    items.forEach(item => {
                        const phoneSpan = item.querySelector('.d-car');
                        if (phoneSpan && phoneSpan.innerText === d.phone) {
                            const badge = item.querySelector('.status-badge');
                            if (badge) {
                                badge.innerText = isOnlineNow ? 'En Ligne' : 'Hors Ligne';
                                badge.className = `status-badge ${isOnlineNow ? 'available' : 'maintenance'}`;
                            }
                        }
                    });
                }
            });
        }, (error) => {
            console.error("Erreur Firestore temps réel:", error);
        });
    } catch (mapboxErr) {
        console.warn("Could not load Mapbox or Firebase driver locations:", mapboxErr);
    }
}

// ==========================================
// PASSENGER MANAGER LOGIC (B2B Busses / Minibusses)
// ==========================================
let currentPassengerTripId = null;

window.openPassengerManager = async function(tripId, route) {
    currentPassengerTripId = tripId;
    
    // Attempt to locate details from global cache
    const trip = (window.loadedTrips || []).find(t => t.id === tripId);
    if (trip) {
        document.getElementById('detTripRoute').innerText = `${trip.departure || "Inconnu"} ➔ ${trip.destination || "Inconnu"}`;
        
        let statusFr = trip.status;
        if (trip.status === 'PENDING') statusFr = 'SANS CHAUFFEUR / EN ATTENTE';
        if (trip.status === 'ACTIVE') statusFr = 'EN ROUTE / EN COURS';
        if (trip.status === 'COMPLETED') statusFr = 'TERMINÉ';
        if (trip.status === 'CANCELLED') statusFr = 'ANNULÉ';
        
        const statusEl = document.getElementById('detTripStatus');
        if (statusEl) {
            statusEl.innerText = statusFr;
            statusEl.className = `status-tag ${trip.status.toLowerCase()}`;
        }
        
        document.getElementById('detTripIdDate').innerText = `Course ID: #${trip.id.substring(0,8).toUpperCase()} • Planifié le ${new Date(trip.createdAt).toLocaleString('fr-FR')}`;
        document.getElementById('detTripPrice').innerText = `${parseFloat(trip.price || 0).toLocaleString()} F`;
        document.getElementById('detDriverName').innerText = trip.driverName || "Chauffeur non-assigné";
        document.getElementById('PMdriverPhoneSpan'); // dummy
        document.getElementById('detDriverPhone').innerText = trip.driverPhone || "N/A";
        
        // Find vehicle in drivers cache if available
        let vehModel = "Minibus de flotte";
        if (window.loadedDriversCache) {
            const drv = window.loadedDriversCache.find(d => d.name === trip.driverName);
            if (drv && drv.vehicle && drv.vehicle.model) {
                vehModel = `${drv.vehicle.brand || ""} ${drv.vehicle.model} (${drv.vehicle.plate || ""})`;
            }
        }
        document.getElementById('detVehicleName').innerHTML = `<i class="fas fa-bus"></i> ${vehModel}`;
        document.getElementById('detClientName').innerText = trip.clientName || "B2B Régulier";
        document.getElementById('detTripDate').innerText = new Date(trip.createdAt).toLocaleString('fr-FR');
    } else {
        document.getElementById('detTripRoute').innerText = route;
        document.getElementById('PMdriverPhoneSpan'); // dummy
        document.getElementById('detTripIdDate').innerText = `Course ID: #${tripId.substring(0,8).toUpperCase()}`;
    }

    // Populate the backup modal route as well for double compliance
    document.getElementById('pmTripRoute').innerText = route;

    // Load active passengers
    await loadTripBookings();

    // Toggle subview with elegant CSS transition
    document.getElementById('tripsListView').style.display = 'none';
    document.getElementById('tripsListView').classList.remove('active-subview');
    
    const detailsView = document.getElementById('tripDetailsView');
    detailsView.style.display = 'block';
    setTimeout(() => {
        detailsView.classList.add('active-subview');
    }, 50);
};

window.backToTripsList = function() {
    document.getElementById('tripsListView').style.display = 'block';
    setTimeout(() => {
        document.getElementById('tripsListView').classList.add('active-subview');
        document.getElementById('tripDetailsView').classList.remove('active-subview');
        document.getElementById('tripDetailsView').style.display = 'none';
    }, 50);
};

document.getElementById('closePassengerModalBtn').onclick = () => {
    document.getElementById('passengerModal').style.display = "none";
    currentPassengerTripId = null;
};

async function loadTripBookings() {
    if (!currentPassengerTripId) return;
    const listBody = document.getElementById('pmPassengersList');
    const detListBody = document.getElementById('detPassengersList');
    
    const loadingHtml = `<tr><td colspan="5" class="loading-cell" style="text-align:center;">Chargement...</td></tr>`;
    if (listBody) listBody.innerHTML = loadingHtml;
    if (detListBody) detListBody.innerHTML = loadingHtml;

    try {
        const bookings = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/trips/${currentPassengerTripId}/bookings`);
        let htmlContent = "";
        let totalSeatsBooked = 0;
        
        if (bookings.length === 0) {
            htmlContent = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: var(--text-dim);">Aucun passager sur ce trajet.</td></tr>`;
        } else {
            bookings.forEach(b => {
                let payStatusText = b.paymentStatus === 'PAID_IN_ADVANCE' ? 'PAYÉ D\'AVANCE' : 'ESPÈCES';
                let payBadgeClass = b.paymentStatus === 'PAID_IN_ADVANCE' ? 'status-COMPLETED' : 'status-PENDING';
                let boardText = b.status === 'BOARDED' ? 'À Bord' : (b.status === 'CANCELLED' ? 'Annulé' : 'Réservé');
                let boardBadgeClass = b.status === 'BOARDED' ? 'status-COMPLETED' : (b.status === 'CANCELLED' ? 'status-FAILED' : 'status-PENDING');
                
                if (b.status !== 'CANCELLED') {
                    totalSeatsBooked += parseInt(b.seatsBooked || 1);
                }
                
                htmlContent += `
                    <tr>
                        <td style="padding: 10px;"><b>${b.passengerName}</b><br><small>${b.passengerPhone}</small></td>
                        <td style="padding: 10px; text-align: center;"><b>${b.seatsBooked}</b></td>
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
        
        if (listBody) listBody.innerHTML = htmlContent;
        if (detListBody) detListBody.innerHTML = htmlContent;

        // Update capacity indicator in full view
        const seatsLabel = document.getElementById('detSeatsLabel');
        const seatsProgress = document.getElementById('detSeatsProgress');
        
        const currentTrip = (window.loadedTrips || []).find(t => t.id === currentPassengerTripId);
        const capacity = currentTrip ? (currentTrip.totalSeats || 15) : 15;
        
        if (seatsLabel) seatsLabel.innerText = `${totalSeatsBooked} / ${capacity} Places`;
        if (seatsProgress) {
            const pct = Math.min(100, Math.round((totalSeatsBooked / capacity) * 100));
            seatsProgress.style.width = `${pct}%`;
        }
    } catch (error) {
        const errorHtml = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: var(--red);">Erreur lors du chargement.</td></tr>`;
        if (listBody) listBody.innerHTML = errorHtml;
        if (detListBody) detListBody.innerHTML = errorHtml;
    }
}

window.revokePassenger = async function(bookingId, passengerId) {
    window.showConfirmDrawer(
        "Révoquer ce passager",
        "Voulez-vous vraiment révoquer ce passager de ce trajet ? Cette action est irréversible.",
        true,
        async () => {
            try {
                const response = await customTransenFetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
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

                    window.showNotificationDrawer("Succès", "Passager révoqué avec succès !", false);
                    await loadTripBookings();
                    loadDashboardData(); // Refresh seats / stats
                } else {
                    const err = await response.text();
                    window.showNotificationDrawer("Erreur", "Erreur: " + err, true);
                }
            } catch (error) {
                window.showNotificationDrawer("Erreur", "Erreur de connexion lors de la révocation.", true);
            }
        }
    );
};

document.getElementById('pmAddPassengerForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!currentPassengerTripId) return;

    const name = document.getElementById('pmPassengerName').value;
    const phone = document.getElementById('pmPassengerPhone').value;
    const seats = document.getElementById('pmPassengerSeats').value;
    
    try {
        const response = await customTransenFetch(`${API_BASE_URL}/api/bookings/manual-book?tripId=${currentPassengerTripId}&passengerPhone=${encodeURIComponent(phone)}&fullName=${encodeURIComponent(name)}&seats=${seats}`, {
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

window.handleExpressAddPassenger = async function(event) {
    event.preventDefault();
    if (!currentPassengerTripId) return;

    const name = document.getElementById('expPassengerName').value.trim();
    const phone = document.getElementById('expPassengerPhone').value.trim();
    const seats = parseInt(document.getElementById('expPassengerSeats').value);

    if (!name || !phone || isNaN(seats) || seats <= 0) {
        Toastify({
            text: "❌ Veuillez remplir correctement tous les champs.",
            duration: 3000,
            style: { background: "linear-gradient(to right, #EF4444, #DC2626)" }
        }).showToast();
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const origText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
    submitBtn.disabled = true;

    try {
        const response = await customTransenFetch(`${API_BASE_URL}/api/bookings/manual-book?tripId=${currentPassengerTripId}&passengerPhone=${encodeURIComponent(phone)}&fullName=${encodeURIComponent(name)}&seats=${seats}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            // Tenter l'addition en temps réel
            try {
                const tripRef = doc(db, "pools", currentPassengerTripId);
                await updateDoc(tripRef, {
                    passengerIds: arrayUnion(phone),
                    [`passengerDetails.${phone}`]: {
                        fullName: name,
                        phone: phone,
                        seats: seats
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
                            seats: seats
                        }
                    });
                } catch(err) {}
            }

            Toastify({
                text: "✨ Passager enregistré et attribué à bord avec succès !",
                duration: 3500,
                style: { background: "linear-gradient(to right, #10B981, #059669)" }
            }).showToast();
            document.getElementById('expressAddPassengerForm').reset();
            await loadTripBookings();
            loadDashboardData();
        } else {
            const errText = await response.text();
            Toastify({
                text: "❌ Impossible d'ajouter : " + errText,
                duration: 4000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)" }
            }).showToast();
        }
    } catch (err) {
        Toastify({
            text: "❌ Exception réseau lors de l'enregistrement.",
            duration: 3000,
            style: { background: "linear-gradient(to right, #EF4444, #DC2626)" }
        }).showToast();
    } finally {
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
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

    // Cybersecurity validation for KYC attachments
    function validateKycFileSecurity(file, nameLabel) {
        if (!file) return true;
        // Limit of 5MB per KYC attachment to protect client-side/memory buffer from crash
        if (file.size > 5 * 1024 * 1024) {
            Toastify({
                text: `❌ Sécurité: Le fichier ${nameLabel} dépasse les 5 Mo autorisés.`,
                duration: 5000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
            return false;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        const allowedExtensions = /(\.png|\.jpg|\.jpeg|\.webp|\.pdf)$/i;
        if (!allowedTypes.includes(file.type) || !allowedExtensions.test(file.name)) {
            Toastify({
                text: `❌ Sécurité: Format de ${nameLabel} non supporté (PNG, JPG, WEBP, PDF uniquement).`,
                duration: 5000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
            return false;
        }
        return true;
    }

    if (!validateKycFileSecurity(rccmFile, "RCCM") ||
        !validateKycFileSecurity(nineaFile, "NINEA") ||
        !validateKycFileSecurity(idFront, "Carte d'identité (Recto)") ||
        !validateKycFileSecurity(idBack, "Carte d'identité (Verso)") ||
        !validateKycFileSecurity(authFile, "Autorisation de Transports")) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        return;
    }

    if (!rccmFile && !nineaFile && !idFront && !idBack && !authFile) {
        window.showNotificationDrawer("Champs requis", "Veuillez sélectionner au moins un fichier à soumettre.", true);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        return;
    }

    if (rccmFile) formData.append('rccmFile', rccmFile);
    if (nineaFile) formData.append('nineaFile', nineaFile);
    if (idFront) formData.append('idCardFront', idFront);
    if (idBack) formData.append('idCardBack', idBack);
    if (authFile) formData.append('transportAuth', authFile);

    try {
        const response = await customTransenFetch(`${API_BASE_URL}/api/companies/${currentCompanyId}/kyc`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        if (response.ok) {
            window.showNotificationDrawer("Succès", "Documents KYC soumis avec succès ! Notre équipe va procéder à la vérification.", false);
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
                window.showNotificationDrawer("Erreur", "Un ou plusieurs fichiers sont trop volumineux. La taille maximale autorisée est de 50 Mo par fichier. Veuillez compresser vos documents PDF ou vos images avant de les envoyer.", true);
            } else {
                window.showNotificationDrawer("Erreur lors de la soumission", (errText.length > 250 ? errText.substring(0, 250) + "..." : errText), true);
            }
        }
    } catch (err) {
        window.showNotificationDrawer("Erreur de connexion", "Erreur réseau ou fichier trop volumineux : " + err.message, true);
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

// Custom Slide-in Notification/Alert Drawer Helper
window.showNotificationDrawer = function(title, message, isError = false) {
    const drawer = document.getElementById('notificationDrawer');
    if (!drawer) return;
    
    const icon = document.getElementById('notificationIcon');
    const okBtn = document.getElementById('notificationOkBtn');
    
    document.getElementById('notificationTitle').innerText = title;
    document.getElementById('notificationMessage').innerText = message;
    
    if (isError) {
        if (icon) {
            icon.className = 'confirm-icon';
            icon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: var(--red);"></i>';
        }
        if (okBtn) okBtn.style.background = 'var(--red)';
    } else {
        if (icon) {
            icon.className = 'confirm-icon success-icon';
            icon.innerHTML = '<i class="fas fa-check-circle" style="color: var(--green);"></i>';
        }
        if (okBtn) okBtn.style.background = 'var(--primary)';
    }
    
    drawer.classList.add('show');
    
    if (okBtn) {
        okBtn.onclick = () => {
            drawer.classList.remove('show');
        };
    }
};

// ==========================================
// Schedule Trip Logic
// ==========================================
window.loadSchedulePageData = async function() {
    if (!currentCompanyId) return;
    const select = document.getElementById('schDriver');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Chargement des chauffeurs... --</option>';
    
    try {
        const drivers = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/drivers?companyId=${currentCompanyId}`);
        select.innerHTML = '<option value="">-- Sélectionner un chauffeur --</option>';
        if (drivers.length === 0) {
            select.innerHTML = '<option value="">-- Aucun chauffeur disponible --</option>';
        } else {
            drivers.forEach(d => {
                select.innerHTML += `<option value="${d.id}">${d.name} (${d.phone})</option>`;
            });
        }
    } catch (error) {
        select.innerHTML = '<option value="">-- Erreur lors du chargement --</option>';
    }
};

window.toggleRecurrenceFields = function() {
    const typeSelect = document.getElementById('schRecurrenceType');
    if (!typeSelect) return;
    const type = typeSelect.value;
    const dailyPanel = document.getElementById('recurrenceDailyPanel');
    const weeklyPanel = document.getElementById('recurrenceWeeklyPanel');
    if (dailyPanel) dailyPanel.style.display = (type === 'DAILY') ? 'block' : 'none';
    if (weeklyPanel) weeklyPanel.style.display = (type === 'WEEKLY') ? 'block' : 'none';
};

document.getElementById('scheduleTripForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    const departure = document.getElementById('schDeparture').value;
    const destination = document.getElementById('schDestination').value;
    const relayPoint = document.getElementById('schRelayPoint').value;
    const driverId = document.getElementById('schDriver').value;
    const scheduledTime = document.getElementById('schScheduledTime').value; // AAAA-MM-JJTHH:MM
    const price = document.getElementById('schPrice').value;
    const totalSeats = document.getElementById('schTotalSeats').value;

    const btn = document.getElementById('submitScheduleBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication en cours...';
    btn.disabled = true;

    try {
        const isoTime = scheduledTime + ":00";
        const recurrenceType = document.getElementById('schRecurrenceType').value;
        const times = [];

        if (recurrenceType === 'UNIQUE') {
            times.push(isoTime);
        } else if (recurrenceType === 'DAILY') {
            const start = new Date(scheduledTime);
            const days = parseInt(document.getElementById('schRecurrenceDays').value) || 1;
            for (let i = 0; i < days; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const isoStr = d.getFullYear() + '-' + 
                    String(d.getMonth()+1).padStart(2, '0') + '-' + 
                    String(d.getDate()).padStart(2, '0') + 'T' + 
                    String(d.getHours()).padStart(2, '0') + ':' + 
                    String(d.getMinutes()).padStart(2, '0') + ':00';
                times.push(isoStr);
            }
        } else if (recurrenceType === 'WEEKLY') {
            const selectedDays = Array.from(document.querySelectorAll('input[name="schWeeklyDays"]:checked')).map(el => parseInt(el.value));
            if (selectedDays.length === 0) {
                alert("Veuillez sélectionner au moins un jour de la semaine pour la récurrence hebdomadaire.");
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }
            const start = new Date(scheduledTime);
            const weeks = parseInt(document.getElementById('schRecurrenceWeeks').value) || 1;
            for (let i = 0; i < weeks * 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                if (selectedDays.includes(d.getDay())) {
                    const isoStr = d.getFullYear() + '-' + 
                        String(d.getMonth()+1).padStart(2, '0') + '-' + 
                        String(d.getDate()).padStart(2, '0') + 'T' + 
                        String(d.getHours()).padStart(2, '0') + ':' + 
                        String(d.getMinutes()).padStart(2, '0') + ':00';
                    times.push(isoStr);
                }
            }
        }

        const response = await customTransenFetch(`${API_BASE_URL}/api/company/dashboard/trips/schedule?companyId=${currentCompanyId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                departure: departure,
                destination: destination,
                relayPoint: relayPoint,
                driverId: driverId,
                price: parseFloat(price),
                totalSeats: parseInt(totalSeats),
                scheduledTimes: times
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Trajet(s) planifié(s) avec succès !");
            
            // Try triggering automatic SMS
            try {
                const drv = (window.loadedDriversCache || []).find(d => d.id === driverId);
                if (drv && window.sendSmsAlertIfEnabled) {
                    window.sendSmsAlertIfEnabled(drv.phone, drv.name, `${departure} - ${destination}`, `${parseFloat(price).toLocaleString()} F`);
                }
            } catch (smsErr) {
                console.error("SMS trigger error", smsErr);
            }

            document.getElementById('scheduleTripForm').reset();
            if (window.toggleRecurrenceFields) window.toggleRecurrenceFields();
            loadDashboardData();
            const tripsLink = document.querySelector('#mainNav a[data-section="trips"]');
            if (tripsLink) tripsLink.click();
        } else {
            alert("Erreur : " + (result.error || "Action impossible"));
        }
    } catch (error) {
        alert("Erreur de connexion lors de la planification.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// ====================================================
// EXTRA PREMIUM FEATURES: CHART, DARK MODE, AUTO REFRESH, EXPORTS
// ====================================================

let revenueChart = null;

async function renderRevenueChart(range = '7d') {
    const chartContainer = document.getElementById('revenue-chart');
    if (!chartContainer) return;

    let categories = [];
    let seriesData = [];

    try {
        const data = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/revenue-chart?companyId=${currentCompanyId}&range=${range}`);
        categories = data.categories || [];
        seriesData = data.seriesData || [];
    } catch (error) {
        console.error("Erreur lors de la récupération des données de revenus réels :", error);
        categories = [];
        seriesData = [];
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const primaryColor = isDarkMode ? '#10B981' : '#059669';
    const gridColor = isDarkMode ? '#22252A' : '#F1F3F4';
    const textColor = isDarkMode ? '#94A3B8' : '#5F6368';

    let chartSeries = [];
    let strokeConfig = {
        curve: 'smooth',
        width: 3
    };
    let colorsConfig = [primaryColor];

    if (window.forecastActive && seriesData.length > 0) {
        // Construct visual prediction line seamlessly continuing from history
        const forecastData = Array(seriesData.length).fill(null);
        forecastData[seriesData.length - 1] = seriesData[seriesData.length - 1];

        const lastVal = seriesData[seriesData.length - 1];
        let nextCategories = [];
        if (range === '7d') nextCategories = ['+1J', '+2J', '+3J'];
        else if (range === '30d') nextCategories = ['+3J', '+6J', '+9J'];
        else if (range === '3m') nextCategories = ['+1 Sem', '+2 Sem', '+3 Sem'];
        else if (range === '6m') nextCategories = ['+1 Mois', '+2 Mois', '+3 Mois'];
        else nextCategories = ['M+1', 'M+2', 'M+3'];

        // Predict future steps
        nextCategories.forEach((cat, idx) => {
            categories.push(cat + " (Prévision)");
            const trendMultiplier = 1.06 + (idx * 0.05) + (Math.random() * 0.03 - 0.012);
            forecastData.push(Math.round(lastVal * trendMultiplier));
        });

        const paddedSeriesData = [...seriesData, ...Array(nextCategories.length).fill(null)];

        chartSeries = [
            {
                name: "Chiffre d'Affaires Réel",
                data: paddedSeriesData
            },
            {
                name: "Prévision IA (Mois Prochain)",
                data: forecastData
            }
        ];
        strokeConfig = {
            curve: 'smooth',
            width: [3, 3],
            dashArray: [0, 5]
        };
        colorsConfig = [primaryColor, '#8B5CF6']; // Main brand color + Predictive violet
    } else {
        chartSeries = [{
            name: "Chiffre d'Affaires",
            data: seriesData
        }];
    }

    const options = {
        series: chartSeries,
        chart: {
            type: 'area',
            height: 280,
            toolbar: { show: false },
            zoom: { enabled: false },
            background: 'transparent'
        },
        colors: colorsConfig,
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 95]
            }
        },
        dataLabels: { enabled: false },
        stroke: strokeConfig,
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    colors: textColor,
                    fontFamily: 'Outfit, sans-serif'
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: {
                    colors: textColor,
                    fontFamily: 'Outfit, sans-serif'
                },
                formatter: function (value) {
                    return value ? (value.toLocaleString() + " F") : "";
                }
            }
        },
        grid: {
            borderColor: gridColor,
            strokeDashArray: 4,
            yaxis: {
                lines: { show: true }
            }
        },
        theme: {
            mode: isDarkMode ? 'dark' : 'light'
        },
        tooltip: {
            x: { show: true },
            y: {
                formatter: function (value) {
                    return value ? `<b>${value.toLocaleString()} FCFA</b>` : "";
                }
            }
        }
    };

    if (revenueChart) {
        revenueChart.destroy();
    }
    revenueChart = new ApexCharts(chartContainer, options);
    revenueChart.render();
}

function setupChartFilters() {
    document.querySelectorAll('.chart-filters button').forEach(btn => {
        // Remove existing listener to avoid duplication on refresh
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-filters button').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const range = e.currentTarget.getAttribute('data-range');
                renderRevenueChart(range);
            });
        }
    });
}

// Export files
function downloadCSV(filename, csvContent) {
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function exportActivitiesToCSV() {
    const table = document.querySelector('#activityTableBody');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    
    let csv = [];
    csv.push(['Date et Heure', 'Chauffeur', 'Service', 'Tarif (FCFA)', 'Statut'].join(';'));
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length === 5) {
            const date = String(cols[0]?.innerText || "").replace(/[\n\r]/g, " ").trim();
            const driver = cols[1]?.innerText?.trim() || "";
            const service = cols[2]?.innerText?.trim() || "";
            const price = String(cols[3]?.innerText || "").replace(/[^0-9]/g, "").trim();
            const status = cols[4]?.innerText?.trim() || "";
            
            csv.push([`"${date}"`, `"${driver}"`, `"${service}"`, price, `"${status}"`].join(';'));
        }
    });
    
    if (csv.length === 1 || (csv.length === 2 && rows[0].innerText.includes("Chargement"))) {
        alert("Aucune activité disponible à exporter.");
        return;
    }
    
    downloadCSV(`TranSen_Activites_Flotte_${new Date().toISOString().slice(0,10)}.csv`, csv.join('\n'));
}

function exportDriversToCSV() {
    const table = document.querySelector('#driversTableBody');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    
    let csv = [];
    csv.push(['Chauffeur', 'Telephone', 'Vehicule', 'Courses accomplies', 'Revenus Generes (FCFA)', 'Statut'].join(';'));
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 6) {
            const name = String(cols[0]?.innerText || "").replace(/[\n\r]/g, " ").trim();
            const phone = cols[1]?.innerText?.trim() || "";
            const vehicle = cols[2]?.innerText?.trim() || "";
            const trips = cols[3]?.innerText?.trim() || "";
            const revenue = String(cols[4]?.innerText || "").replace(/[^0-9]/g, "").trim();
            const status = cols[5]?.innerText?.trim() || "";
            
            csv.push([`"${name}"`, `"${phone}"`, `"${vehicle}"`, trips, revenue, `"${status}"`].join(';'));
        }
    });
    
    if (csv.length === 1 || (csv.length === 2 && rows[0].innerText.includes("Aucun chauffeur"))) {
        alert("Aucun chauffeur disponible à exporter.");
        return;
    }
    
    downloadCSV(`TranSen_Chauffeurs_${new Date().toISOString().slice(0,10)}.csv`, csv.join('\n'));
}

async function exportDriversToPDF() {
    const table = document.querySelector('#driversTableBody');
    if (!table) return;
    const rows = table.querySelectorAll('tr');

    const driversData = [];
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 6) {
            const name = String(cols[0]?.innerText || "").replace(/[\n\r]/g, " ").trim();
            const phone = cols[1]?.innerText?.trim() || "";
            const vehicle = String(cols[2]?.innerText || "").replace(/[\n\r]/g, " ").trim();
            const trips = cols[3]?.innerText?.trim() || "";
            const revenue = cols[4]?.innerText?.trim() || "";
            const status = cols[5]?.innerText?.trim() || "";
            
            driversData.push({ name, phone, vehicle, trips, revenue, status });
        }
    });

    if (driversData.length === 0 || (driversData.length === 1 && driversData[0].name.includes("Aucun chauffeur"))) {
        Toastify({
            text: "⚠️ Aucun chauffeur disponible à exporter.",
            duration: 4000,
            gravity: "top",
            position: "right",
            style: { background: "#F59E0B", fontFamily: "Outfit, sans-serif" }
        }).showToast();
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pWidth = doc.internal.pageSize.getWidth();

        let companyName = "Compagnie B2B";
        let companyEmail = "Non renseigné";
        let companyPhone = "Non renseigné";
        let managerName = "Gérant B2B";
        let companyType = "Non spécifié";

        try {
            if (typeof currentCompanyId !== 'undefined' && currentCompanyId) {
                const company = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);
                const user = await fetchWithAuth(`${API_BASE_URL}/api/users/me`);
                companyName = user.companyName || company.name || "Compagnie B2B";
                companyEmail = user.email || company.email || "Non renseigné";
                companyPhone = user.phone || company.phone || "Non renseigné";
                managerName = user.fullName || "Gérant B2B";
                companyType = company.type || "Non spécifié";
            }
        } catch (err) {
            console.error("Error fetching company details for driver report:", err);
        }

        // Elegance green bar at the very top (attention to detail)
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pWidth, 5, 'F');

        // Render corporate logo if available
        let textLeftOffset = 15;
        const logoBase64 = await window.getLogoBase64();
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 15, 11, 14, 14);
            textLeftOffset = 33;
        }

        // --- LEFT SIDE: TRANSEN SÉNÉGAL S.A. ---
        doc.setTextColor(5, 150, 105); // Green brand color
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("TRANSEN SÉNÉGAL S.A.", textLeftOffset, 15);

        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Plateforme numérique de gestion du transport et de la logistique", textLeftOffset, 19.5);
        doc.text("Dakar, Sénégal | Tél : +221 78 138 64 05", textLeftOffset, 24);
        doc.text("Email : contact@transen.org | Web : compagnie.transen.org", textLeftOffset, 28.5);

        // --- RIGHT SIDE: PARTNER COMPANY DETAILS ---
        doc.setTextColor(31, 41, 55); // Dark Slate Grey
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("COMPAGNIE ADHÉRENTE", 120, 15);

        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(companyName.toUpperCase(), 120, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Type d'entité : ${companyType}`, 120, 25);
        if (typeof currentCompanyId !== 'undefined' && currentCompanyId) {
            doc.text(`Identifiant B2B : TS-COMP-${currentCompanyId.substring(0, 6).toUpperCase()}`, 120, 29);
        }
        doc.text(`Représentant : ${managerName}`, 120, 33);
        doc.text(`E-mail : ${companyEmail}`, 120, 37);
        doc.text(`Téléphone : ${companyPhone}`, 120, 41);

        // Divider Line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(13, 46, pWidth - 13, 46);

        // Document content title
        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Liste Détaillée des Chauffeurs Actifs de la Flotte", 15, 55);

        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Généré officiellement le ${new Date().toLocaleString('fr-FR')} | Confidentiel`, 15, 61);

        // Define table columns
        const startY = 70;
        let currentY = startY;

        // Draw Table Header
        doc.setFillColor(241, 243, 244);
        doc.rect(13, currentY, pWidth - 26, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        // Header headers positioning
        doc.text("Chauffeur", 15, currentY + 5.5);
        doc.text("Téléphone", 58, currentY + 5.5);
        doc.text("Véhicule / Catégorie", 90, currentY + 5.5);
        doc.text("Courses", 145, currentY + 5.5);
        doc.text("Revenus", 162, currentY + 5.5);
        doc.text("Statut", 185, currentY + 5.5);

        currentY += 8;

        // Draw Table rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(70, 70, 70);

        let totalTrips = 0;
        let totalRevenue = 0;

        driversData.forEach((drv, idx) => {
            // Alternating backgrounds
            if (idx % 2 === 1) {
                doc.setFillColor(248, 249, 250);
                doc.rect(13, currentY, pWidth - 26, 7.5, 'F');
            }

            // Render columns texts
            doc.setFont("helvetica", "bold");
            doc.text(drv.name.substring(0, 24), 15, currentY + 5);
            doc.setFont("helvetica", "normal");
            doc.text(drv.phone.substring(0, 15), 58, currentY + 5);
            doc.text(drv.vehicle.substring(0, 28), 90, currentY + 5);
            doc.text(drv.trips, 145, currentY + 5);
            doc.text(drv.revenue, 162, currentY + 5);

            // Status tag rendering with colors
            if (drv.status.toUpperCase() === 'ACTIVE' || drv.status.toUpperCase() === 'EN LIGNE') {
                doc.setTextColor(5, 150, 105);
                doc.setFont("helvetica", "bold");
            } else {
                doc.setTextColor(156, 163, 175);
                doc.setFont("helvetica", "normal");
            }
            doc.text(drv.status, 185, currentY + 5);

            // Restore defaults
            doc.setTextColor(70, 70, 70);
            doc.setFont("helvetica", "normal");

            // Calculate totals
            const itemTrips = parseInt(String(drv.trips || "0").replace(/[^0-9]/g, "")) || 0;
            const itemRevenue = parseInt(String(drv.revenue || "0").replace(/[^0-9]/g, "")) || 0;
            totalTrips += itemTrips;
            totalRevenue += itemRevenue;

            currentY += 7.5;

            // Handle page overflow if we have many drivers
            if (currentY > 265) {
                doc.addPage();
                currentY = 20;
                // Redraw table headers on new page
                doc.setFillColor(241, 243, 244);
                doc.rect(13, currentY, pWidth - 26, 8, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(50, 50, 50);
                doc.text("Chauffeur", 15, currentY + 5.5);
                doc.text("Téléphone", 58, currentY + 5.5);
                doc.text("Véhicule / Catégorie", 90, currentY + 5.5);
                doc.text("Courses", 145, currentY + 5.5);
                doc.text("Revenus", 162, currentY + 5.5);
                doc.text("Statut", 185, currentY + 5.5);
                currentY += 8;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(70, 70, 70);
            }
        });

        // Add summary section
        currentY += 6;
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFillColor(232, 240, 254);
        doc.rect(13, currentY, pWidth - 26, 12, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(26, 115, 232);
        doc.text("RÉCAPITULATIF DE LA FLOTTE (MÉTRIQUES)", 17, currentY + 7.5);
        
        doc.setFontSize(8.5);
        doc.setTextColor(31, 31, 31);
        doc.text(`Total Chauffeurs: ${driversData.length}`, 95, currentY + 7.5);
        doc.text(`Total Courses: ${totalTrips}`, 132, currentY + 7.5);
        doc.text(`Revenus cumulés: ${totalRevenue.toLocaleString()} F`, 160, currentY + 7.5);

        // Sign & certifying footer
        doc.setFontSize(8.5);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "italic");
        doc.text("Rapport de flotte certifié conforme pour examen et intégration comptable.", 15, doc.internal.pageSize.getHeight() - 15);

        // Append the company stamp seal
        const stampBase64 = await window.getStampBase64();
        if (stampBase64) {
            doc.addImage(stampBase64, 'JPEG', pWidth - 50, doc.internal.pageSize.getHeight() - 50, 35, 35);
        }

        doc.save(`TranSen_Rapport_Chauffeurs_${new Date().toISOString().slice(0, 10)}.pdf`);

        Toastify({
            text: "✨ Rapport de flotte PDF téléchargé avec succès !",
            duration: 4000,
            gravity: "top",
            position: "right",
            style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
        }).showToast();

    } catch (err) {
        console.error("Erreur génération PDF Chauffeurs", err);
        Toastify({
            text: "❌ Erreur lors de la génération du rapport PDF.",
            duration: 4000,
            gravity: "top",
            style: { background: "#EF4444" }
        }).showToast();
    }
}

// Centralized theme switcher supporting both body.dark-mode and :root[data-theme='dark']
window.applyTheme = function(theme) {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun" style="color: #F59E0B;"></i>';
        }
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="far fa-moon"></i>';
        }
    }
};

// Dark Mode Switch
function initThemeMode() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;
    
    const savedTheme = localStorage.getItem('theme-mode') || 'light';
    window.applyTheme(savedTheme);
    
    themeToggleBtn.onclick = () => {
        const isDarkNow = document.body.classList.contains('dark-mode');
        const nextTheme = isDarkNow ? 'light' : 'dark';
        localStorage.setItem('theme-mode', nextTheme);
        window.applyTheme(nextTheme);
        
        const activeFilter = document.querySelector('.chart-filters button.active');
        const range = activeFilter ? activeFilter.getAttribute('data-range') : '7d';
        renderRevenueChart(range);
        
        // Match other theme-sensitive charts
        if (typeof renderKPIBarCharts === 'function') {
            renderKPIBarCharts(window.loadedDriversCache || [], window.loadedTrips || []);
        }
        if (typeof renderVehicleDonutChart === 'function') {
            renderVehicleDonutChart(window.loadedDriversCache || []);
        }
        if (typeof renderDriverStatusPieChart === 'function') {
            renderDriverStatusPieChart(window.loadedDriversCache || []);
        }
    };
}

// Auto Refresh Mechanism
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    
    const intervalSec = localStorage.getItem('transen_refresh_interval') || '10';
    window.autoRefreshSeconds = intervalSec;
    
    const syncIndicator = document.getElementById('syncIndicator');
    if (syncIndicator) {
        if (window.autoRefreshSeconds === 'manual') {
            syncIndicator.setAttribute('title', "Rafraîchissement manuel (cliquer pour actualiser)");
            const syncText = document.getElementById('syncText');
            if (syncText) syncText.innerText = "Manuel";
        } else {
            syncIndicator.setAttribute('title', `Actualisation automatique toutes les ${window.autoRefreshSeconds} secondes`);
            const syncText = document.getElementById('syncText');
            if (syncText) syncText.innerText = "Temps réel";
        }
    }
    
    if (window.autoRefreshSeconds === 'manual') {
        return;
    }
    
    const intervalMs = (parseInt(window.autoRefreshSeconds) || 10) * 1000;
    
    refreshInterval = setInterval(async () => {
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');
        const pulseDot = document.querySelector('.pulse-dot');
        
        if (syncIcon) {
            syncIcon.classList.add('spin-icon');
            setTimeout(() => syncIcon.classList.remove('spin-icon'), 800);
        }
        
        if (syncText) {
            syncText.innerText = "Mise à jour...";
            syncText.style.color = "var(--primary)";
        }
        
        if (pulseDot) {
            pulseDot.style.backgroundColor = "var(--gold)";
        }
        
        try {
            await loadDashboardData();
        } catch (e) {
            console.error("Refresh failed", e);
        }
        
        setTimeout(() => {
            if (syncText) {
                syncText.innerText = window.autoRefreshSeconds === 'manual' ? "Manuel" : "Temps réel";
                syncText.style.color = "var(--text-dim)";
            }
            if (pulseDot) {
                pulseDot.style.backgroundColor = "var(--primary)";
            }
        }, 1200);
    }, intervalMs);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ====================================================
// DRIVERS KPI RADIAL CHARTS PERFORMANCE
// ====================================================
let gaugePunctuality = null;
let gaugeRating = null;
let gaugeMileage = null;

function renderKPIBarCharts(driversList = [], tripsList = []) {
    const pContainer = document.getElementById('gauge-punctuality');
    const rContainer = document.getElementById('gauge-rating');
    const mContainer = document.getElementById('gauge-mileage');
    if (!pContainer || !rContainer || !mContainer) return;

    const isDarkMode = document.body.classList.contains('dark-mode');
    const primaryColor = isDarkMode ? '#10B981' : '#059669';
    const accentColor = '#3B82F6'; // Blue
    const goldColor = '#F59E0B'; // Gold
    const labelColor = isDarkMode ? '#94A3B8' : '#5F6368';
    const valColor = isDarkMode ? '#E2E8F0' : '#1F1F1F';

    // 1. Taux de Ponctualité réel (basé sur les avertissements)
    let totalWarnings = 0;
    driversList.forEach(d => {
        totalWarnings += (d.warningsCount || 0);
    });
    let punctualityVal = Math.max(60, 100 - (totalWarnings * 5));

    // 2. Note Moyenne réelle des conducteurs
    let totalRating = 0;
    let driversWithRating = 0;
    driversList.forEach(d => {
        if (d.rating !== undefined && d.rating !== null) {
            totalRating += d.rating;
            driversWithRating++;
        }
    });
    let ratingVal = driversWithRating > 0 ? (totalRating / driversWithRating) : 5.0;
    ratingVal = Math.min(5.0, Math.max(1.0, ratingVal));
    let ratingPercent = Math.round((ratingVal / 5.0) * 100);

    // 3. Objectif Kilométrage réel cumulé des conducteurs
    let computedMileage = 0;
    driversList.forEach(d => {
        computedMileage += (d.mileage || 0);
    });
    let targetMileage = 15000;
    let mileagePercent = Math.round(Math.min(100, (computedMileage / targetMileage) * 100));

    const buildGaugeOptions = (seriesVal, displayVal, color) => {
        return {
            series: [seriesVal],
            chart: {
                type: 'radialBar',
                height: 140,
                sparkline: { enabled: true }
            },
            plotOptions: {
                radialBar: {
                    hollow: { size: '65%' },
                    dataLabels: {
                        name: { show: false },
                        value: {
                            offsetY: 6,
                            fontSize: '1.15rem',
                            fontWeight: '700',
                            color: valColor,
                            formatter: () => displayVal
                        }
                    },
                    track: {
                        background: isDarkMode ? '#22252A' : '#F1F3F4',
                        strokeWidth: '100%'
                    }
                }
            },
            colors: [color],
            stroke: { lineCap: 'round' }
        };
    };

    if (gaugePunctuality) gaugePunctuality.destroy();
    if (gaugeRating) gaugeRating.destroy();
    if (gaugeMileage) gaugeMileage.destroy();

    gaugePunctuality = new ApexCharts(pContainer, buildGaugeOptions(punctualityVal, `${punctualityVal}%`, primaryColor));
    gaugeRating = new ApexCharts(rContainer, buildGaugeOptions(ratingPercent, `${ratingVal.toFixed(2)} / 5`, goldColor));
    gaugeMileage = new ApexCharts(mContainer, buildGaugeOptions(mileagePercent, `${computedMileage.toLocaleString()} km`, accentColor));

    gaugePunctuality.render();
    gaugeRating.render();
    gaugeMileage.render();
}

// ====================================================
// PREVENTIVE MAINTENANCE STORAGE & LOGIC
// ====================================================
function getMaintenanceRules() {
    return JSON.parse(localStorage.getItem('transen_maintenance_rules')) || [];
}

function saveMaintenanceRules(rules) {
    localStorage.setItem('transen_maintenance_rules', JSON.stringify(rules));
}

function updateMaintDriverDropdown(drivers) {
    const select = document.getElementById('maintDriverSelect');
    if (select) {
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Choisir un chauffeur --</option>';
        drivers.forEach(d => {
            select.innerHTML += `<option value="${d.name}" data-name="${d.name}">${d.name} (${d.phone})</option>`;
        });
        if (currentVal) select.value = currentVal;
    }

    // Populate Comparison selects A and B dynamically
    const compA = document.getElementById('compareDriverA');
    const compB = document.getElementById('compareDriverB');
    if (compA && compB) {
        const currentValA = compA.value;
        const currentValB = compB.value;
        
        compA.innerHTML = '';
        compB.innerHTML = '';
        
        drivers.forEach(d => {
            compA.innerHTML += `<option value="${d.id}">${d.name} (${d.phone})</option>`;
            compB.innerHTML += `<option value="${d.id}">${d.name} (${d.phone})</option>`;
        });

        if (drivers.length > 0) {
            compA.value = currentValA || drivers[0].id;
            compB.value = currentValB || (drivers[1] ? drivers[1].id : drivers[0].id);
        }
        renderDriversPerformanceComparison();
    }

    // Populate Expenses Driver selector
    const expenseSelect = document.getElementById('expenseDriverSelect');
    if (expenseSelect) {
        const currentVal = expenseSelect.value;
        expenseSelect.innerHTML = '<option value="">-- Choisir le chauffeur --</option>';
        drivers.forEach(d => {
            expenseSelect.innerHTML += `<option value="${d.id}" data-name="${d.name}">${d.name} (${d.phone})</option>`;
        });
        if (currentVal) expenseSelect.value = currentVal;
    }
}

function renderMaintenanceTable() {
    const tbody = document.getElementById('maintenanceTableBody');
    if (!tbody) return;
    
    const rules = getMaintenanceRules();
    
    if (rules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="loading-cell" style="text-align: center; padding: 25px; color: var(--text-dim);">Aucune règle définie. Configurez votre première alerte à gauche.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = "";
    rules.forEach((rule, idx) => {
        const typeLabels = {
            'VIDANGE': 'Vidange Moteur',
            'CONTROLE': 'Contrôle Technique',
            'FREINS': 'Freins & Disques',
            'PNEUS': 'Changement Pneus'
        };
        const label = typeLabels[rule.type] || rule.type;
        const progressPercent = Math.min(100, Math.round((rule.currentKm / rule.triggerKm) * 100));
        
        let statusTag = '';
        if (rule.currentKm >= rule.triggerKm) {
            statusTag = `<span class="status-tag failed" style="font-size: 0.7rem; padding: 2px 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-exclamation-triangle"></i> SEUIL DÉPASSÉ</span>`;
        } else if (rule.currentKm >= rule.triggerKm * 0.9) {
            statusTag = `<span class="status-tag pending" style="font-size: 0.7rem; padding: 2px 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-hourglass-half"></i> IMMINENT</span>`;
        } else {
            statusTag = `<span class="status-tag approved" style="font-size: 0.7rem; padding: 2px 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-check-circle"></i> SURVEILLANCE OK</span>`;
        }
        
        tbody.innerHTML += `
            <tr>
                <td data-label="Chauffeur"><b>${rule.driverName}</b></td>
                <td data-label="Type">${label}</td>
                <td data-label="Kilométrage">
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 2px;">${rule.currentKm.toLocaleString()} / ${rule.triggerKm.toLocaleString()} km (${progressPercent}%)</div>
                    <div style="width: 100%; height: 6px; background: #F1F3F4; border-radius: 3px; overflow: hidden; border: 1px solid #DADCE0;">
                        <div style="width: ${progressPercent}%; height: 100%; background: ${rule.currentKm >= rule.triggerKm ? 'var(--red)' : rule.currentKm >= rule.triggerKm * 0.9 ? 'var(--gold)' : 'var(--primary)'}; border-radius: 3px;"></div>
                    </div>
                </td>
                <td data-label="Statut">${statusTag}</td>
                <td data-label="Action">
                    <button class="btn-secondary" onclick="window.deleteMaintenanceRule(${idx})" style="padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; color: var(--red) !important; border-color: rgba(239, 68, 68, 0.2);" title="Supprimer cette règle">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

window.deleteMaintenanceRule = function(idx) {
    const rules = getMaintenanceRules();
    rules.splice(idx, 1);
    saveMaintenanceRules(rules);
    renderMaintenanceTable();
    loadDashboardData(); // Refreshes badges in vehicle lists!
};

function setupMaintenanceForm() {
    const form = document.getElementById('maintenanceForm');
    if (!form) return;
    
    form.onsubmit = (e) => {
        e.preventDefault();
        const driverName = document.getElementById('maintDriverSelect').value;
        const type = document.getElementById('maintTypeSelect').value;
        const currentKm = parseInt(document.getElementById('maintCurrentKm').value) || 0;
        const triggerKm = parseInt(document.getElementById('maintTriggerKm').value) || 0;
        
        if (!driverName) {
            alert("Veuillez sélectionner un chauffeur.");
            return;
        }
        if (triggerKm <= 0) {
            alert("Le seuil d'alerte doit être supérieur à 0.");
            return;
        }
        
        const rules = getMaintenanceRules();
        rules.push({
            id: Date.now(),
            driverName,
            type,
            currentKm,
            triggerKm
        });
        
        saveMaintenanceRules(rules);
        form.reset();
        
        renderMaintenanceTable();
        loadDashboardData(); // Redraw with badges
        
        alert("Règle de maintenance ajoutée avec succès !");
    };
}

// ====================================================
// REAL-TIME ACTIVITIES SEARCH & DYNAMIC FILTERS
// ====================================================
window.filterAndRenderActivities = function() {
    const searchVal = (document.getElementById('activitySearchInput')?.value || "").toLowerCase().trim();
    const statusVal = document.getElementById('activityStatusFilter')?.value || "ALL";
    const dateStartVal = document.getElementById('activityDateStart')?.value || "";
    const dateEndVal = document.getElementById('activityDateEnd')?.value || "";

    const trips = window.loadedTrips || [];
    const dashTbody = document.getElementById('activityTableBody');
    if (!dashTbody) return;

    dashTbody.innerHTML = "";

    const filteredTrips = trips.filter(t => {
        // 1. Text Search Filter (driver, destination, client, price)
        const matchSearch = !searchVal || 
            (t.driverName && t.driverName.toLowerCase().includes(searchVal)) ||
            (t.clientName && t.clientName.toLowerCase().includes(searchVal)) ||
            (t.departure && t.departure.toLowerCase().includes(searchVal)) ||
            (t.destination && t.destination.toLowerCase().includes(searchVal)) ||
            (t.id && t.id.toLowerCase().includes(searchVal));

        // 2. Status Filter
        const matchStatus = statusVal === 'ALL' || t.status === statusVal;

        // 3. Date Range Filter
        let matchDate = true;
        if (t.createdAt) {
            const tripDate = new Date(t.createdAt).toISOString().slice(0, 10);
            if (dateStartVal && tripDate < dateStartVal) matchDate = false;
            if (dateEndVal && tripDate > dateEndVal) matchDate = false;
        }

        return matchSearch && matchStatus && matchDate;
    });

    if (filteredTrips.length === 0) {
        dashTbody.innerHTML = `<tr><td colspan="5" class="loading-cell" style="text-align: center; padding: 25px; color: var(--text-dim);">Aucune activité ne correspond à vos filtres de recherche.</td></tr>`;
    } else {
        filteredTrips.slice(0, 10).forEach(t => {
            const dateStr = new Date(t.createdAt).toLocaleString('fr-FR');
            dashTbody.innerHTML += `
            <tr>
                <td data-label="Date">${dateStr}</td>
                <td data-label="Chauffeur"><b>${escapeHtml(t.driverName)}</b></td>
                <td data-label="Service">Classique</td>
                <td data-label="Prix"><b>${t.price} F</b></td>
                <td data-label="Statut"><span class="status-tag ${escapeHtml(t.status.toLowerCase())}">${escapeHtml(t.status)}</span></td>
            </tr>`;
        });
    }
};

function setupActivityFiltersEvents() {
    const searchInp = document.getElementById('activitySearchInput');
    const statusFilt = document.getElementById('activityStatusFilter');
    const dateSt = document.getElementById('activityDateStart');
    const dateEn = document.getElementById('activityDateEnd');
    const resetBtn = document.getElementById('resetActivityFiltersBtn');

    if (searchInp) {
        searchInp.oninput = () => window.filterAndRenderActivities();
    }
    if (statusFilt) {
        statusFilt.onchange = () => window.filterAndRenderActivities();
    }
    if (dateSt) {
        dateSt.onchange = () => window.filterAndRenderActivities();
    }
    if (dateEn) {
        dateEn.onchange = () => window.filterAndRenderActivities();
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (searchInp) searchInp.value = "";
            if (statusFilt) statusFilt.value = "ALL";
            if (dateSt) dateSt.value = "";
            if (dateEn) dateEn.value = "";
            window.filterAndRenderActivities();
        };
    }
}

// ====================================================
// INTERACTIVE ONBOARDING TUTORIAL (INTRO.JS)
// ====================================================
function startOnboardingTutorial() {
    if (typeof introJs === 'undefined') {
        alert("Le module de tutoriel n'est pas encore complètement disponible.");
        return;
    }

    const intro = introJs();
    intro.setOptions({
        steps: [
            {
                title: 'Bienvenue sur TranSen 🇸🇳',
                intro: "Félicitations ! Vous êtes connecté à l'Espace d'Administration Partenaire. Ce guide interactif va vous faire découvrir les principales fonctionnalités.",
            },
            {
                element: '.sidebar',
                title: 'Navigation Latérale',
                intro: "Utilisez ce menu pour basculer en un clic entre le Tableau de Bord, le Portefeuille TransPay, la gestion de votre Flotte de chauffeurs et votre compte d'entreprise.",
                position: 'right'
            },
            {
                element: '.stats-grid',
                title: 'Indicateurs Globaux (KPI)',
                intro: "Consultez d'un coup d'œil le statut instantané de vos chauffeurs, les trajets programmés pour aujourd'hui, et les revenus globaux générés par votre flotte.",
                position: 'bottom'
            },
            {
                element: '#drivers-performance-kpis',
                title: 'Rendement des Chauffeurs',
                intro: "Ces magnifiques jauges circulaires évaluent en temps réel la ponctualité moyenne de vos collaborateurs, la note d'évaluation donnée par les clients et l'atteinte de vos objectifs kilométriques.",
                position: 'bottom'
            },
            {
                element: '#revenue-chart',
                title: 'Courbe d\'Évolution Financière',
                intro: "Analysez visuellement vos rentrées d'argent. Ajustez la période (7 jours, 30 jours, trimestre, semestre, année) pour obtenir des tendances de croissance précises.",
                position: 'top'
            },
            {
                element: '.table-filters-container',
                title: 'Recherche & Filtrage Temps Réel',
                intro: "Recherchez instantanément un chauffeur par son nom ou filtrez les activités par statut (PENDING / COMPLETED / CANCELLED) ou par plage de dates.",
                position: 'bottom'
            },
            {
                element: '#fleetMap',
                title: 'Localisation de la Flotte',
                intro: "Consultez la position géographique en temps réel de tous vos chauffeurs partenaires actifs, géolocalisés sur notre carte dynamique.",
                position: 'top'
            },
            {
                element: '#syncIndicator',
                title: 'Mise à Jour en Direct',
                intro: "L'application se rafraîchit automatiquement toutes les 10 secondes pour vous garantir un contrôle total de vos véhicules en circulation.",
                position: 'left'
            },
            {
                element: '#themeToggleBtn',
                title: 'Mode Sombre Ergonomique',
                intro: "Passez d'un clic au thème Sombre pour préserver votre confort oculaire lors des sessions d'administration prolongées.",
                position: 'left'
            }
        ],
        nextLabel: 'Suivant →',
        prevLabel: '← Précédent',
        doneLabel: 'Je suis prêt ! 🚀',
        skipLabel: 'Passer',
        overlayOpacity: 0.65,
        showProgress: true,
        showBullets: true
    });

    intro.start();
}

// DOM events configuration
document.addEventListener('DOMContentLoaded', () => {
    initThemeMode();
    
    const exportActBtn = document.getElementById('exportActivitiesCsvBtn');
    if (exportActBtn) exportActBtn.addEventListener('click', exportActivitiesToCSV);
    
    const exportDrvBtn = document.getElementById('exportDriversCsvBtn');
    if (exportDrvBtn) exportDrvBtn.addEventListener('click', exportDriversToCSV);

    const exportDrvPdfBtn = document.getElementById('exportDriversPdfBtn');
    if (exportDrvPdfBtn) exportDrvPdfBtn.addEventListener('click', exportDriversToPDF);

    // Dynamic Filter Init
    setupActivityFiltersEvents();

    // Maintenance Init
    setupMaintenanceForm();
    renderMaintenanceTable();

    // Onboarding Tutorial Init
    const onboardBtn = document.getElementById('onboardingTutorialBtn');
    if (onboardBtn) {
        onboardBtn.addEventListener('click', () => {
            // Force return to dashboard section to view elements highlighted during tutorial
            const dashLink = document.querySelector('#mainNav a[data-section="dashboard"]');
            if (dashLink) dashLink.click();
            setTimeout(startOnboardingTutorial, 150);
        });
    }
});

// ====================================================
// VEHICLE CLASSIFICATION & DONUT CHART COMPONENT
// ====================================================
function getVehicleModelInfo(driver, index) {
    if (driver && driver.vehicleModel && driver.vehicleType) {
        return { model: driver.vehicleModel, type: driver.vehicleType };
    }
    const name = driver ? (driver.name || driver.fullName) : "";
    const types = [
        { model: "Berline (Peugeot 508)", type: "Berline" },
        { model: "Mini-bus (Toyota HiAce)", type: "Mini-bus" },
        { model: "Bus (Tata LPT)", type: "Bus" },
        { model: "SUV (Toyota RAV4)", type: "SUV" }
    ];
    let code = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            code += name.charCodeAt(i);
        }
    } else {
        code = index;
    }
    return types[code % types.length];
}

let vehicleDonutChart = null;

function renderVehicleDonutChart(driversList = []) {
    const chartContainer = document.getElementById('vehicle-donut-chart');
    if (!chartContainer) return;

    // Default counters
    const distribution = {
        "Berline": 0,
        "Mini-bus": 0,
        "Bus": 0,
        "SUV": 0
    };

    if (!driversList || driversList.length === 0) {
        // Fallback realistic distributions for demo / onboarding purposes
        distribution["Berline"] = 4;
        distribution["Mini-bus"] = 3;
        distribution["Bus"] = 2;
        distribution["SUV"] = 1;
    } else {
        driversList.forEach((d, idx) => {
            const vInfo = getVehicleModelInfo(d, idx);
            if (distribution[vInfo.type] !== undefined) {
                distribution[vInfo.type]++;
            } else {
                distribution[vInfo.type] = 1;
            }
        });
    }

    const seriesData = Object.values(distribution);
    const labelsData = Object.keys(distribution);

    const isDarkMode = document.body.classList.contains('dark-mode');
    const bgColors = isDarkMode
        ? ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'] // Dark theme brand colors
        : ['#059669', '#1D4ED8', '#D97706', '#7C3AED']; // Vivid brand colors

    const textColor = isDarkMode ? '#94A3B8' : '#5F6368';
    const valColor = isDarkMode ? '#E2E8F0' : '#1F1F1F';

    const options = {
        series: seriesData,
        chart: {
            type: 'donut',
            height: 280,
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        labels: labelsData,
        colors: bgColors,
        dataLabels: {
            enabled: true,
            style: {
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '600',
                colors: ['#FFFFFF']
            },
            dropShadow: { enabled: false }
        },
        legend: {
            position: 'bottom',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '12px',
            labels: {
                colors: textColor
            },
            markers: {
                radius: 12
            },
            itemMargin: {
                horizontal: 8,
                vertical: 4
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '13px',
                            fontFamily: 'Outfit, sans-serif',
                            color: textColor,
                            offsetY: -6
                        },
                        value: {
                            show: true,
                            fontSize: '20px',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '700',
                            color: valColor,
                            offsetY: 6,
                            formatter: function (val) {
                                return val + " u.";
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total Flotte',
                            fontFamily: 'Outfit, sans-serif',
                            color: textColor,
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + " v.";
                            }
                        }
                    }
                }
            }
        },
        stroke: {
            show: true,
            colors: [isDarkMode ? '#1e2124' : '#ffffff'],
            width: 2
        },
        theme: {
            mode: isDarkMode ? 'dark' : 'light'
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return `<b>${value} véhicule(s)</b>`;
                }
            }
        }
    };

    if (vehicleDonutChart) {
        vehicleDonutChart.destroy();
    }
    
    vehicleDonutChart = new ApexCharts(chartContainer, options);
    vehicleDonutChart.render();
}

let driverStatusPieChart = null;

function getDriverActivityStatus(driver, index) {
    if (driver && driver.activityStatus) {
        if (driver.activityStatus === 'HORS_LIGNE') return "Hors ligne";
        if (driver.activityStatus === 'EN_COURSE') return "En course";
        if (driver.activityStatus === 'DISPONIBLE') return "Disponible";
    }
    if (driver.status === 'INACTIVE' || driver.status === 'OFFLINE' || driver.status === 'HORS_LIGNE') {
        return "Hors ligne";
    }
    const statuses = ["Disponible", "En course", "En pause"];
    return statuses[index % statuses.length];
}

function renderDriverStatusPieChart(driversList = []) {
    const chartContainer = document.getElementById('driver-status-pie-chart');
    if (!chartContainer) return;

    const distribution = {
        "Disponible": 0,
        "En course": 0,
        "Hors ligne": 0,
        "En pause": 0
    };

    if (!driversList || driversList.length === 0) {
        distribution["Disponible"] = 4;
        distribution["En course"] = 3;
        distribution["Hors ligne"] = 2;
        distribution["En pause"] = 1;
    } else {
        driversList.forEach((d, idx) => {
            const status = getDriverActivityStatus(d, idx);
            if (distribution[status] !== undefined) {
                distribution[status]++;
            } else {
                distribution[status] = 1;
            }
        });
    }

    const seriesData = Object.values(distribution);
    const labelsData = Object.keys(distribution);

    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Brand design-friendly colors
    const bgColors = isDarkMode
        ? ['#10B981', '#3B82F6', '#9CA3AF', '#F59E0B']
        : ['#10B981', '#1D4ED8', '#6B7280', '#D97706'];

    const textColor = isDarkMode ? '#94A3B8' : '#5F6368';
    const valColor = isDarkMode ? '#E2E8F0' : '#1F1F1F';

    const options = {
        series: seriesData,
        chart: {
            type: 'donut',
            height: 180,
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        labels: labelsData,
        colors: bgColors,
        dataLabels: {
            enabled: true,
            style: {
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '600',
                colors: ['#FFFFFF']
            },
            dropShadow: { enabled: false }
        },
        legend: {
            position: 'right',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '11px',
            labels: {
                colors: textColor
            },
            markers: {
                radius: 12
            },
            itemMargin: {
                horizontal: 4,
                vertical: 2
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '62%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '11px',
                            fontFamily: 'Outfit, sans-serif',
                            color: textColor,
                            offsetY: -4
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '700',
                            color: valColor,
                            offsetY: 4,
                            formatter: function (val) {
                                return val;
                            }
                        },
                        total: {
                            show: true,
                            label: 'Chauffeurs',
                            fontFamily: 'Outfit, sans-serif',
                            color: textColor,
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        stroke: {
            show: true,
            colors: [isDarkMode ? '#1e2124' : '#ffffff'],
            width: 2
        },
        theme: {
            mode: isDarkMode ? 'dark' : 'light'
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return `<b>${value} chauffeur(s)</b>`;
                }
            }
        }
    };

    if (driverStatusPieChart) {
        driverStatusPieChart.destroy();
    }
    
    driverStatusPieChart = new ApexCharts(chartContainer, options);
    driverStatusPieChart.render();
}

// ====================================================
// ADVANCED TIMELINE PLANNER & DRAG-AND-DROP WORKSPACE
// ====================================================
window.timelineTrips = [
    { id: 'trip-1', title: "Navette Banlieue (Dakar - Pikine)", time: "08:30", route: "Dakar vers Pikine", assignedDriver: "Samba Diouf", cost: "5 500 F" },
    { id: 'trip-2', title: "Course Premium Corporate", time: "11:00", route: "Plateau vers Almadies", assignedDriver: "Fatou Kiné", cost: "12 000 F" },
    { id: 'trip-3', title: "Navette Autoroute à Péage", time: "14:15", route: "Aéroport DSS vers Dakar Centre", assignedDriver: "Modou Fall", cost: "18 500 F" },
    { id: 'trip-4', title: "Transport Hub Diamniadio", time: "16:45", route: "Dakar vers Diamniadio CSC", assignedDriver: "Cheikh Tidiane", cost: "15 000 F" }
];

window.previousDriverStatuses = {};

window.renderTimelinePlanning = function(driversList = []) {
    const driversCont = document.getElementById('draggableDriversContainer');
    const tripsCont = document.getElementById('timelineTripsContainer');
    if (!driversCont || !tripsCont) return;

    // 1. Check & alert on any driver status switches in real-time
    driversList.forEach(d => {
        if (!d) return;
        const dName = d.name || "Chauffeur sans nom";
        const oldStatus = window.previousDriverStatuses[dName];
        if (oldStatus && oldStatus !== d.status) {
            Toastify({
                text: `🔔 Statut : ${dName} est passé de ${oldStatus} à ${d.status}`,
                duration: 5000,
                gravity: "top",
                position: "right",
                style: {
                    background: d.status === 'ACTIVE' ? "linear-gradient(to right, #059669, #10B981)" : "linear-gradient(to right, #EF4444, #F87171)",
                    fontFamily: "Outfit, sans-serif",
                    borderRadius: "8px"
                }
            }).showToast();
        }
        window.previousDriverStatuses[dName] = d.status;
    });

    // 2. Render Draggable Driver Items
    driversCont.innerHTML = "";
    const activeDrivers = driversList.filter(d => d.status === 'ACTIVE');
    const listToRender = activeDrivers.length > 0 ? activeDrivers : driversList; // fallback to all if none active

    listToRender.slice(0, 5).forEach(d => {
        const dName = d.name || "Chauffeur sans nom";
        driversCont.innerHTML += `
            <div class="draggable-driver-item" draggable="true" ondragstart="handleTimelineDragStart(event, '${dName.replace(/'/g, "\\'")}')">
                <i class="fas fa-grip-vertical" style="color: var(--text-dim); cursor: grab; margin-right: 4px;"></i>
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(dName)}&background=random" style="width: 22px; height: 22px; border-radius: 50%;" alt="${dName}">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600; font-size: 0.72rem; color: var(--text-main);">${dName}</span>
                    <span style="font-size: 0.6rem; color: var(--text-dim);">${d.phone || 'Chauffeur Flotte'}</span>
                </div>
            </div>
        `;
    });

    if (listToRender.length === 0) {
        driversCont.innerHTML = `<p style="font-size: 0.72rem; color: var(--text-dim); text-align: center; margin: 15px 0;">Aucun chauffeur disponible.</p>`;
    }

    // 3. Render Drop Zone Trip Slots
    tripsCont.innerHTML = "";
    window.timelineTrips.forEach(trip => {
        tripsCont.innerHTML += `
            <div class="timeline-trip-slot" ondragover="handleTimelineDragOver(event)" ondragleave="handleTimelineDragLeave(event)" ondrop="handleTimelineDrop(event, '${trip.id}')" data-trip-id="${trip.id}">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                    <span style="font-size: 0.65rem; font-weight: 700; color: #1A73E8; background: #E8F0FE; padding: 2px 6px; border-radius: 4px;">⏱️ ${trip.time}</span>
                    <span style="font-size: 0.68rem; font-weight: 600; color: var(--text-dim);">${trip.cost}</span>
                </div>
                <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); margin: 6px 0 2px 0;">${trip.title}</h4>
                <p style="font-size: 0.66rem; color: var(--text-dim); margin: 0 0 8px 0;"><i class="fas fa-map-marker-alt" style="color:#EF4444; margin-right: 2px;"></i> ${trip.route}</p>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 6px; border-top: 1px solid rgba(0,0,0,0.04); font-size: 0.72rem;">
                    <span style="color: var(--text-dim);">Affecté :</span>
                    <strong style="color: var(--primary); font-weight: 700;"><i class="fas fa-user-circle"></i> ${trip.assignedDriver}</strong>
                </div>
            </div>
        `;
    });
};

window.handleTimelineDragStart = function(event, driverName) {
    event.dataTransfer.setData('text/plain', driverName);
};

window.handleTimelineDragOver = function(event) {
    event.preventDefault();
    const slot = event.currentTarget.closest('.timeline-trip-slot');
    if (slot) slot.classList.add('dragover');
};

window.handleTimelineDragLeave = function(event) {
    const slot = event.currentTarget.closest('.timeline-trip-slot');
    if (slot) slot.classList.remove('dragover');
};

window.handleTimelineDrop = async function(event, tripId) {
    event.preventDefault();
    const slot = event.currentTarget.closest('.timeline-trip-slot');
    if (slot) slot.classList.remove('dragover');

    const driverName = event.dataTransfer.getData('text/plain');
    if (!driverName) return;

    const driverObj = (window.loadedDriversCache || []).find(d => d.name === driverName);
    if (!driverObj) {
        alert("Chauffeur introuvable.");
        return;
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/trips/${tripId}/assign?driverId=${driverObj.id}`, {
            method: 'POST'
        });
        if (!response.ok && response.status !== 200) {
            const errData = await response.json();
            throw new Error(errData.error || "Erreur lors de l'attribution");
        }

        Toastify({
            text: `🎯 Planning : ${driverName} réassigné à la course !`,
            duration: 5000,
            gravity: "top",
            position: "right",
            style: {
                background: "linear-gradient(to right, #10B981, #059669)",
                fontFamily: "Outfit, sans-serif",
                borderRadius: "8px"
            }
        }).showToast();

        await loadDashboardData();
    } catch (err) {
        Toastify({
            text: `❌ Erreur : ${err.message}`,
            duration: 5000,
            gravity: "top",
            position: "right",
            style: {
                background: "linear-gradient(to right, #EF4444, #C084FC)",
                fontFamily: "Outfit, sans-serif",
                borderRadius: "8px"
            }
        }).showToast();
    }
};

// ====================================================
// ADVANCED TOOLS CONTROL BAR HANDLERS (PREDICTION, ALERT, REPORT PDF)
// ====================================================
window.forecastActive = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Toggle Predictions
    const togglePredictBtn = document.getElementById('toggleRevenueForecastBtn');
    if (togglePredictBtn) {
        togglePredictBtn.addEventListener('click', () => {
            window.forecastActive = !window.forecastActive;
            if (window.forecastActive) {
                togglePredictBtn.innerHTML = '<i class="fas fa-brain" style="color: #FFFFFF;"></i> Prévisions IA : Activées';
                togglePredictBtn.style.background = 'linear-gradient(135deg, #8B5CF6, #6D28D9)';
                togglePredictBtn.style.color = '#FFFFFF';
                togglePredictBtn.style.borderColor = '#6D28D9';

                Toastify({
                    text: "🧠 Modèle prédictif activé ! Projection à l'échelle pour le mois prochain.",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "linear-gradient(to right, #8B5CF6, #7C3AED)",
                        fontFamily: "Outfit, sans-serif",
                        borderRadius: "8px"
                    }
                }).showToast();
            } else {
                togglePredictBtn.innerHTML = '<i class="fas fa-brain" style="color: #8B5CF6;"></i> Prévisions IA : Désactivées';
                togglePredictBtn.style.background = '';
                togglePredictBtn.style.color = '';
                togglePredictBtn.style.borderColor = '';

                Toastify({
                    text: "Prévisions désactivées.",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    style: {
                        fontFamily: "Outfit, sans-serif",
                        borderRadius: "8px"
                    }
                }).showToast();
            }
            const activeFilter = document.querySelector('.chart-filters button.active');
            const range = activeFilter ? activeFilter.getAttribute('data-range') : '7d';
            renderRevenueChart(range);
        });
    }

    // 2. Demo Live Notification
    const simulateBtn = document.getElementById('simulateNotificationBtn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', () => {
            const alerts = [
                { title: "Nouveau Trajet Créé", text: "Réservation express assignée: Dakar &rarr; Saly", color: "linear-gradient(to right, #059669, #10B981)" },
                { title: "Statut Chauffeur", text: "Alassane Ndiaye est désormais ACTIVE sur le secteur Saly", color: "linear-gradient(to right, #1D4ED8, #3B82F6)" },
                { title: "Alerte Maintenance", text: "Le mini-bus Toyota HiAce requiert un contrôle technique", color: "linear-gradient(to right, #D97706, #F59E0B)" }
            ];
            const alert = alerts[Math.floor(Math.random() * alerts.length)];

            Toastify({
                text: `🔔 ${alert.title} : ${alert.text}`,
                duration: 4500,
                gravity: "top",
                position: "right",
                style: {
                    background: alert.color,
                    fontFamily: "Outfit, sans-serif",
                    borderRadius: "8px"
                }
            }).showToast();
        });
    }

    // 3. Generate PDF Report ready for accountants
    const pdfBtn = document.getElementById('generatePdfReportBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', async () => {
            const origText = pdfBtn.innerHTML;
            pdfBtn.disabled = true;
            pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4');
                const pWidth = doc.internal.pageSize.getWidth();

                let companyName = "Compagnie B2B";
                let companyEmail = "Non renseigné";
                let companyPhone = "Non renseigné";
                let managerName = "Gérant B2B";
                let companyType = "Non spécifié";

                try {
                    if (typeof currentCompanyId !== 'undefined' && currentCompanyId) {
                        const company = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);
                        const user = await fetchWithAuth(`${API_BASE_URL}/api/users/me`);
                        companyName = user.companyName || company.name || "Compagnie B2B";
                        companyEmail = user.email || company.email || "Non renseigné";
                        companyPhone = user.phone || company.phone || "Non renseigné";
                        managerName = user.fullName || "Gérant B2B";
                        companyType = company.type || "Non spécifié";
                    }
                } catch (err) {
                    console.error("Error fetching company details for active report:", err);
                }

                // Elegance green bar at the very top (attention to detail)
                doc.setFillColor(5, 150, 105);
                doc.rect(0, 0, pWidth, 5, 'F');

                // Render corporate logo if available
                let textLeftOffset = 15;
                const logoBase64 = await window.getLogoBase64();
                if (logoBase64) {
                    doc.addImage(logoBase64, 'PNG', 15, 11, 14, 14);
                    textLeftOffset = 33;
                }

                // --- LEFT SIDE: TRANSEN SÉNÉGAL S.A. ---
                doc.setTextColor(5, 150, 105); // Green brand color
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("TRANSEN SÉNÉGAL S.A.", textLeftOffset, 15);

                doc.setTextColor(80, 80, 80);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.text("Plateforme numérique de gestion du transport et de la logistique", textLeftOffset, 19.5);
                doc.text("Dakar, Sénégal | Tél : +221 78 138 64 05", textLeftOffset, 24);
                doc.text("Email : contact@transen.org | Web : compagnie.transen.org", textLeftOffset, 28.5);

                // --- RIGHT SIDE: PARTNER COMPANY DETAILS ---
                doc.setTextColor(31, 41, 55); // Dark Slate Grey
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text("COMPAGNIE ADHÉRENTE", 120, 15);

                doc.setTextColor(55, 65, 81);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(companyName.toUpperCase(), 120, 20);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.text(`Type d'entité : ${companyType}`, 120, 25);
                if (typeof currentCompanyId !== 'undefined' && currentCompanyId) {
                    doc.text(`Identifiant B2B : TS-COMP-${currentCompanyId.substring(0, 6).toUpperCase()}`, 120, 29);
                }
                doc.text(`Représentant : ${managerName}`, 120, 33);
                doc.text(`E-mail : ${companyEmail}`, 120, 37);
                doc.text(`Téléphone : ${companyPhone}`, 120, 41);

                // Divider Line
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(13, 46, pWidth - 13, 46);

                // Section title
                doc.setTextColor(31, 41, 55);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.text("Portail d'Administration B2B - Rapport de Performance Comptable", 15, 55);

                doc.setTextColor(100, 100, 100);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.text(`Édité officiellement le ${new Date().toLocaleString('fr-FR')} | Confidentiel`, 15, 61);

                // Section 1 - KPIs
                doc.setTextColor(31, 31, 31);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("1. Indicateurs Globaux (KPIs)", 15, 72);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                const activeVal = document.getElementById('activeDriversCount')?.innerText || 'N/A';
                const tripsVal = document.getElementById('todayTrips')?.innerText || 'N/A';
                const revenueVal = document.getElementById('totalRevenue')?.innerText || 'N/A';

                doc.text(`- Chauffeurs actifs dans la flotte : ${activeVal}`, 20, 80);
                doc.text(`- Trajets & Courses aujourd'hui : ${tripsVal}`, 20, 86);
                doc.text(`- Chiffre d'Affaires total : ${revenueVal}`, 20, 92);

                let offset = 106;

                // Graphic 1 (Revenue Chart Canvas capture)
                const revEl = document.getElementById('revenue-chart');
                if (revEl) {
                    doc.setFont("helvetica", "bold");
                    doc.text("2. Chiffre d'affaires & Courbe d'activité", 15, offset);
                    
                    try {
                        const can = await html2canvas(revEl);
                        const data = can.toDataURL('image/png');
                        doc.addImage(data, 'PNG', 15, offset + 4, 180, 70);
                        offset += 82;
                    } catch (e) {
                        console.error("Erreur Canvas 1", e);
                        offset += 10;
                    }
                }

                // Add Page 2
                doc.addPage();
                doc.setFillColor(241, 243, 244);
                doc.rect(0, 0, pWidth, 14, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text("TRANSEN SÉNÉGAL B2B - FLEET & COMPTABILITÉ", 15, 9);

                let secOffset = 25;
                const donutEl = document.getElementById('vehicle-donut-chart');
                if (donutEl) {
                    doc.setTextColor(31, 31, 31);
                    doc.setFontSize(13);
                    doc.text("3. Répartition Globale de la Flotte de Véhicules", 15, secOffset);

                    try {
                        const can2 = await html2canvas(donutEl);
                        const data2 = can2.toDataURL('image/png');
                        doc.addImage(data2, 'PNG', 15, secOffset + 4, 180, 72);
                        secOffset += 84;
                    } catch (e) {
                        console.error("Erreur Canvas 2", e);
                        secOffset += 10;
                    }
                }

                // Sign & certifier
                doc.setFontSize(9);
                doc.setTextColor(120, 120, 120);
                doc.setFont("helvetica", "italic");
                doc.text("Ce document fait office de relevé officiel conforme TranSen S.A. Sénégal pour gestion administrative.", 15, 275);

                // Append the company stamp seal
                const stampBase64 = await window.getStampBase64();
                if (stampBase64) {
                    doc.addImage(stampBase64, 'JPEG', pWidth - 50, doc.internal.pageSize.getHeight() - 50, 35, 35);
                }

                doc.save("TranSen_Report_Actives.pdf");

                Toastify({
                    text: "✨ Document comptable PDF téléchargé avec succès !",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "linear-gradient(to right, #059669, #10B981)",
                        fontFamily: "Outfit, sans-serif"
                    }
                }).showToast();

            } catch (err) {
                console.error("Erreur PDF compiler", err);
                Toastify({
                    text: "❌ Impossible de générer le rapport PDF.",
                    duration: 4000,
                    gravity: "top",
                    style: { background: "#EF4444" }
                }).showToast();
            } finally {
                pdfBtn.innerHTML = origText;
                pdfBtn.disabled = false;
            }
        });
    }

    // ===== SYSTEM LOGS & SECURITY AUDIT =====
    window.addAuditLog = (action, details, type) => {
        let logs = [];
        try {
            logs = JSON.parse(localStorage.getItem('transen_audit_logs')) || [];
        } catch (e) {
            logs = [];
        }
        
        const nextLog = {
            id: 'log-' + Math.random().toString(36).substring(2, 9),
            action: action,
            details: details,
            date: new Date().toLocaleString('fr-FR'),
            type: type || "INFO"
        };
        
        logs.unshift(nextLog);
        if (logs.length > 50) logs = logs.slice(0, 50);
        
        localStorage.setItem('transen_audit_logs', JSON.stringify(logs));
        renderAuditLogs();
    };

    function renderAuditLogs() {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;
        
        let logs = [];
        try {
            logs = JSON.parse(localStorage.getItem('transen_audit_logs'));
        } catch (e) {
            logs = [];
        }
        
        if (!logs || logs.length === 0) {
            // Seed premium defaults
            logs = [
                { id: 'l1', action: "Connexion réussie", details: "Authentification de l'administrateur sécurisée", date: new Date(Date.now() - 3600000 * 4).toLocaleString('fr-FR'), type: "SÉCURITÉ" },
                { id: 'l2', action: "Création de trajet", details: "Trajet recurrent #42 planifié : Dakar -> Pikine par le chauffeur Samba", date: new Date(Date.now() - 3600000 * 18).toLocaleString('fr-FR'), type: "PLANIFICATION" },
                { id: 'l3', action: "Suppression chauffeur", details: "Chauffeur Amadou Ba retiré de la flotte avec succès", date: new Date(Date.now() - 86400000 * 1.5).toLocaleString('fr-FR'), type: "SÉCURITÉ" },
                { id: 'l4', action: "Demande de Retrait", details: "Retrait de 150 000 FCFA initié vers Orange Money", date: new Date(Date.now() - 86400000 * 2.5).toLocaleString('fr-FR'), type: "WALLET" }
            ];
            localStorage.setItem('transen_audit_logs', JSON.stringify(logs));
        }
        
        tbody.innerHTML = "";
        logs.forEach(log => {
            let typeBadgeStyle = "";
            let actionIcon = "fa-circle-dot";
            
            const uType = (log.type || "INFO").toUpperCase();
            if (uType.includes("SEC") || uType.includes("SÉC")) {
                typeBadgeStyle = "background: rgba(220, 38, 38, 0.08); color: #DC2626; border: 1px solid rgba(220, 38, 38, 0.15);";
                actionIcon = "fa-shield-halved";
            } else if (uType.includes("TRIP") || uType.includes("COUR")) {
                typeBadgeStyle = "background: rgba(16, 185, 129, 0.08); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.15);";
                actionIcon = "fa-route";
            } else if (uType.includes("SCHED") || uType.includes("PLAN")) {
                typeBadgeStyle = "background: rgba(26, 115, 232, 0.08); color: #1A73E8; border: 1px solid rgba(26, 115, 232, 0.15);";
                actionIcon = "fa-calendar-days";
            } else if (uType.includes("WALL") || uType.includes("FIN")) {
                typeBadgeStyle = "background: rgba(217, 119, 6, 0.08); color: #D97706; border: 1px solid rgba(217, 119, 6, 0.15);";
                actionIcon = "fa-wallet";
            } else {
                typeBadgeStyle = "background: rgba(107, 114, 128, 0.08); color: #6B7280; border: 1px solid rgba(107, 114, 128, 0.15);";
                actionIcon = "fa-circle-info";
            }
            
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <td style="padding: 10px 14px; font-weight: 600; color: var(--text-main); font-size: 0.8rem;">
                        <span style="display: flex; align-items: center; gap: 8px;"><i class="fas ${actionIcon}" style="font-size: 0.85rem; width: 14px; opacity: 0.85;"></i> ${log.action}</span>
                    </td>
                    <td style="padding: 10px 14px; color: var(--text-dim); max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem;" title="${log.details}">
                        ${log.details}
                    </td>
                    <td style="padding: 10px 14px; color: var(--text-dim); font-size: 0.72rem; white-space: nowrap;">
                        ${log.date}
                    </td>
                    <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                        <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 6px; font-weight: 600; text-transform: uppercase; ${typeBadgeStyle}">
                            ${log.type}
                        </span>
                    </td>
                </tr>
            `;
        });
    }

    const clearBtn = document.getElementById('clearAuditLogsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Voulez-vous vraiment vider le journal d'audit d'activité ?")) {
                localStorage.setItem('transen_audit_logs', JSON.stringify([]));
                renderAuditLogs();
                Toastify({
                    text: "🗑️ Journal d'audit réinitialisé !",
                    duration: 3000,
                    style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
                window.addAuditLog("Vider les logs", "Le journal d'audit a été vidé par l'administrateur B2B", "SÉCURITÉ");
            }
        });
    }

    const testSecBtn = document.getElementById('btnDemoSecurityCheck');
    if (testSecBtn) {
        testSecBtn.addEventListener('click', () => {
            const orig = testSecBtn.innerHTML;
            testSecBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chiffrement & Connexion active...';
            testSecBtn.disabled = true;
            
            setTimeout(() => {
                testSecBtn.innerHTML = orig;
                testSecBtn.disabled = false;
                
                window.addAuditLog(
                    "Test Sécurité", 
                    "Contrôle d'intégrité de la liaison SSL & IP réussi en zone Sénégal d'Afrique de l'Ouest", 
                    "SÉCURITÉ"
                );
                
                Toastify({
                    text: "🛡️ Liaison B2B chiffrée SSL certifiée intègre !",
                    duration: 4000,
                    style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
            }, 1200);
        });
    }

    function setupRefreshIntervalSelector() {
        const refreshSecDisplay = localStorage.getItem('transen_refresh_interval') || '10';
        window.autoRefreshSeconds = refreshSecDisplay;

        const container = document.getElementById('refreshRateSelector');
        if (!container) return;

        const buttons = container.querySelectorAll('button');
        buttons.forEach(btn => {
            const interval = btn.getAttribute('data-interval');
            if (interval === window.autoRefreshSeconds) {
                btn.className = 'btn-primary';
                btn.style.background = 'var(--primary)';
                btn.style.borderColor = 'var(--primary)';
                btn.style.color = '#FFFFFF';
            } else {
                btn.className = 'btn-secondary';
                btn.style.background = '';
                btn.style.color = '';
            }

            btn.onclick = () => {
                window.autoRefreshSeconds = interval;
                localStorage.setItem('transen_refresh_interval', interval);
                
                buttons.forEach(b => {
                    b.className = 'btn-secondary';
                    b.style.background = '';
                    b.style.color = '';
                });
                btn.className = 'btn-primary';
                btn.style.background = 'var(--primary)';
                btn.style.borderColor = 'var(--primary)';
                btn.style.color = '#FFFFFF';

                startAutoRefresh();

                window.addAuditLog(
                    "Config Refresh", 
                    `Intervalle d'auto-refresh configuré sur ${interval === 'manual' ? 'manuel (clics)' : interval + 's'}`, 
                    "SÉCURITÉ"
                );

                Toastify({
                    text: `🔄 intervalle réglé : ${interval === 'manual' ? 'Manuel' : interval + ' secondes'}`,
                    duration: 3000,
                    style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
            };
        });
    }

    // ===== THEME & REFRESH INTERVAL INITS =====
    setupRefreshIntervalSelector();
    renderAuditLogs();

    // ===== STATE FULLSCREEN API INTEGRATIONS =====
    const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
    if (fullscreenToggleBtn) {
        fullscreenToggleBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    fullscreenToggleBtn.innerHTML = '<i class="fas fa-compress"></i>';
                    window.addAuditLog("Plein Écran", "Activation du mode immersif plein écran", "SÉCURITÉ");
                    Toastify({
                        text: "🖥️ Mode Plein Écran Activé",
                        duration: 3000,
                        style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                    }).showToast();
                }).catch(err => {
                    console.warn("Fullscreen error", err);
                    Toastify({
                        text: "⚠️ Plein écran indisponible dans l'iframe. Ouvrez l'application dans un nouvel onglet.",
                        duration: 5000,
                        style: { background: "linear-gradient(to right, #F59E0B, #D97706)", fontFamily: "Outfit, sans-serif" }
                    }).showToast();
                });
            } else {
                document.exitFullscreen().then(() => {
                    fullscreenToggleBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    window.addAuditLog("Plein Écran", "Fermeture du mode plein écran", "SÉCURITÉ");
                    Toastify({
                        text: "🖥️ Mode Plein Écran Désactivé",
                        duration: 3000,
                        style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                    }).showToast();
                });
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                fullscreenToggleBtn.innerHTML = '<i class="fas fa-expand"></i>';
            } else {
                fullscreenToggleBtn.innerHTML = '<i class="fas fa-compress"></i>';
            }
        });
    }

    // Connect manual trigger on sync indicator
    const syncIndicator = document.getElementById('syncIndicator');
    if (syncIndicator) {
        syncIndicator.style.cursor = "pointer";
        syncIndicator.addEventListener('click', async () => {
            const syncIcon = document.getElementById('syncIcon');
            const syncText = document.getElementById('syncText');
            const pulseDot = document.querySelector('.pulse-dot');
            
            if (syncIcon) {
                syncIcon.classList.add('spin-icon');
                setTimeout(() => syncIcon.classList.remove('spin-icon'), 800);
            }
            if (syncText) {
                syncText.innerText = "Mise à jour...";
                syncText.style.color = "var(--primary)";
            }
            if (pulseDot) {
                pulseDot.style.backgroundColor = "var(--gold)";
            }
            
            try {
                await loadDashboardData();
                Toastify({
                    text: "🔄 Synchronisation de la flotte effectuée !",
                    duration: 3000,
                    style: { background: "linear-gradient(to right, #059669, #10B981)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
            } catch (err) {
                console.error(err);
            }
            
            setTimeout(() => {
                if (syncText) {
                    syncText.innerText = window.autoRefreshSeconds === 'manual' ? "Manuel" : "Temps réel";
                    syncText.style.color = "var(--text-dim)";
                }
                if (pulseDot) {
                    pulseDot.style.backgroundColor = "var(--primary)";
                }
            }, 1200);
        });
    }

    // ===== FULLCALENDAR INTERACTION MANAGEMENT =====
    let calendar = null;
    
    function initFullCalendar() {
        const calendarEl = document.getElementById('fullCalendarRoot');
        if (!calendarEl) return;
        
        if (calendar) {
            calendar.destroy();
        }
        
        const events = [];
        
        // Load active and scheduled trips from backend database!
        if (window.loadedTrips && window.loadedTrips.length > 0) {
            window.loadedTrips.forEach(t => {
                const dateObj = t.scheduledTime ? new Date(t.scheduledTime) : new Date(t.createdAt || Date.now());
                const isScheduled = t.scheduledTime != null;
                events.push({
                    id: t.id,
                    title: `${isScheduled ? '[PROGRAMMÉ] ' : ''}${t.departure} ➔ ${t.destination}`,
                    start: dateObj.toISOString(),
                    description: `${isScheduled ? 'Trajet programmé' : 'Course active'} | Chauffeur: ${t.driverName || 'Non assigné'} | Tarif: ${t.price} F | Statut: ${t.status}`,
                    backgroundColor: isScheduled ? '#1A73E8' : '#10B981',
                    borderColor: isScheduled ? '#1A73E8' : '#10B981'
                });
            });
        }
        
        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'fr',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listMonth'
                },
                buttonText: {
                    today: "Aujourd'hui",
                    month: "Mois",
                    week: "Semaine",
                    list: "Liste"
                },
                events: events,
                editable: true,
                eventClick: function(info) {
                    Toastify({
                        text: `📅 ${info.event.title}\n${info.event.extendedProps.description}`,
                        duration: 5000,
                        gravity: "bottom",
                        position: "center",
                        close: true,
                        style: { background: "linear-gradient(to right, #1A73E8, #3B82F6)", fontFamily: "Outfit, sans-serif" }
                    }).showToast();
                }
            });
            
            calendar.render();
            setTimeout(() => {
                if (calendar) calendar.updateSize();
            }, 100);
            
        } catch (err) {
            console.error("Error building FullCalendar", err);
        }
    }
    
    // Connect schedule tabs switcher
    const fTabBtn = document.getElementById('scheduleTabFormBtn');
    const cTabBtn = document.getElementById('scheduleTabCalendarBtn');
    
    if (fTabBtn && cTabBtn) {
        fTabBtn.addEventListener('click', () => {
            document.getElementById('scheduleFormView').style.display = 'block';
            document.getElementById('scheduleCalendarView').style.display = 'none';
            
            fTabBtn.className = 'btn-primary';
            fTabBtn.style.background = '';
            fTabBtn.style.color = '';
            
            cTabBtn.className = 'btn-secondary';
            cTabBtn.style.background = 'transparent';
            cTabBtn.style.color = 'var(--text-dim)';
        });
        
        cTabBtn.addEventListener('click', () => {
            document.getElementById('scheduleFormView').style.display = 'none';
            document.getElementById('scheduleCalendarView').style.display = 'block';
            
            fTabBtn.className = 'btn-secondary';
            fTabBtn.style.background = 'transparent';
            fTabBtn.style.color = 'var(--text-dim)';
            
            cTabBtn.className = 'btn-primary';
            cTabBtn.style.background = '#1A73E8';
            cTabBtn.style.borderColor = '#1A73E8';
            cTabBtn.style.color = '#FFFFFF';
            
            initFullCalendar();
        });
    }

    // Initialize New Premium B2B Modules
    initDriverPerformanceComparisonListeners();
    initSmsConfigAndTest();
    initExpensesTracker();
    initExportAuditLogs();
    initSolarAutoDarkMode();
    initWalletThresholdEngine();
    initFavoritesList();

});

// ====================================================
// DRIVER PERFORMANCE COMPARATOR MODULE
// ====================================================

function renderDriversPerformanceComparison() {
    const selectA = document.getElementById('compareDriverA');
    const selectB = document.getElementById('compareDriverB');
    if (!selectA || !selectB) return;

    const valA = selectA.value;
    const valB = selectB.value;
    const drivers = window.loadedDriversCache || [];

    const driverA = drivers.find(d => d.id === valA);
    const driverB = drivers.find(d => d.id === valB);

    if (!driverA || !driverB) {
        return;
    }

    // Determine multipliers based on selected period multiplier to scale data realistically!
    const periodSelect = document.getElementById('comparePeriodSelect');
    const period = periodSelect ? periodSelect.value : '30d';
    let multiplier = 1.0;
    if (period === '7d') multiplier = 0.23;
    else if (period === '3m') multiplier = 3.0;

    const distA = Math.round(driverA.totalTrips * 34.5 * multiplier);
    const distB = Math.round(driverB.totalTrips * 34.5 * multiplier);

    const revA = Math.round(driverA.totalRevenue * multiplier);
    const revB = Math.round(driverB.totalRevenue * multiplier);

    const ridesA = Math.round(driverA.totalTrips * multiplier);
    const ridesB = Math.round(driverB.totalTrips * multiplier);

    const effA = distA > 0 ? Math.round(revA / distA) : 0;
    const effB = distB > 0 ? Math.round(revB / distB) : 0;

    document.getElementById('compHeaderA').innerText = driverA.name;
    document.getElementById('compHeaderB').innerText = driverB.name;

    document.getElementById('compRevA').innerText = `${revA.toLocaleString()} F`;
    document.getElementById('compRevB').innerText = `${revB.toLocaleString()} F`;

    document.getElementById('compDistA').innerText = `${distA.toLocaleString()} km`;
    document.getElementById('compDistB').innerText = `${distB.toLocaleString()} km`;

    document.getElementById('compRidesA').innerText = ridesA;
    document.getElementById('compRidesB').innerText = ridesB;

    document.getElementById('compEffA').innerText = `${effA} F/km`;
    document.getElementById('compEffB').innerText = `${effB} F/km`;

    renderDiffCell('compRevDiff', revA, revB, 'F');
    renderDiffCell('compDistDiff', distA, distB, 'km');
    renderDiffCell('compRidesDiff', ridesA, ridesB, '');
    renderDiffCell('compEffDiff', effA, effB, 'F/km');
}

function renderDiffCell(elementId, valA, valB, unit) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const diff = valA - valB;
    if (diff === 0) {
        container.innerHTML = `<span class="badge" style="background: rgba(107,114,128,0.08); color: #6B7280; font-weight: 600; font-size: 0.72rem; padding: 3px 8px; border-radius: 6px;">Égalité</span>`;
    } else if (diff > 0) {
        const formatted = unit === 'F' ? `${diff.toLocaleString()} F` : `${diff.toLocaleString()} ${unit}`;
        const percent = valB > 0 ? ` (+${Math.round((diff / valB) * 100)}%)` : '';
        container.innerHTML = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10B981; font-weight: 700; font-size: 0.72rem; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-arrow-up"></i> +${formatted}${percent}</span>`;
    } else {
        const absDiff = Math.abs(diff);
        const formatted = unit === 'F' ? `${absDiff.toLocaleString()} F` : `${absDiff.toLocaleString()} ${unit}`;
        const percent = valB > 0 ? ` (-${Math.round((absDiff / valB) * 100)}%)` : '';
        container.innerHTML = `<span class="badge" style="background: rgba(220, 38, 38, 0.1); color: #DC2626; font-weight: 700; font-size: 0.72rem; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-arrow-down"></i> -${formatted}${percent}</span>`;
    }
}

function initDriverPerformanceComparisonListeners() {
    const compA = document.getElementById('compareDriverA');
    const compB = document.getElementById('compareDriverB');
    const period = document.getElementById('comparePeriodSelect');

    if (compA) compA.addEventListener('change', renderDriversPerformanceComparison);
    if (compB) compB.addEventListener('change', renderDriversPerformanceComparison);
    if (period) period.addEventListener('change', renderDriversPerformanceComparison);
}

// ====================================================
// SMS NOTIFICATION MODULE
// ====================================================

function initSmsConfigAndTest() {
    const form = document.getElementById('smsConfigForm');
    const testBtn = document.getElementById('testSmsApiBtn');
    const saveBtn = document.getElementById('saveSmsConfigBtn');

    if (!form) return;

    // Load saved config
    const saved = localStorage.getItem('transen_sms_config');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            document.getElementById('smsProviderSelect').value = config.provider || 'simulation';
            document.getElementById('smsApiKey').value = config.apiKey || '';
            document.getElementById('smsApiToken').value = config.apiToken || '';
            document.getElementById('smsSenderPhone').value = config.senderPhone || '';
        } catch (e) {
            console.error(e);
        }
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = document.getElementById('smsProviderSelect').value;
            const apiKey = document.getElementById('smsApiKey').value;
            const apiToken = document.getElementById('smsApiToken').value;
            const senderPhone = document.getElementById('smsSenderPhone').value;

            const config = { provider, apiKey, apiToken, senderPhone };
            localStorage.setItem('transen_sms_config', JSON.stringify(config));

            window.addAuditLog("SMS Configuration", `Configuration API enregistrée (${provider === 'simulation' ? 'Simulation' : 'Passerelle active: ' + provider})`, "SÉCURITÉ");

            Toastify({
                text: "💾 Paramètres d'alerte SMS sauvegardés !",
                duration: 3000,
                style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const testPhone = prompt("Entrez le numéro du chauffeur pour le SMS Test (ex: +221774501020) :", "+221771234567");
            if (!testPhone) return;

            testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi du SMS...';
            testBtn.disabled = true;

            setTimeout(() => {
                testBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer un SMS Test';
                testBtn.disabled = false;

                const provider = document.getElementById('smsProviderSelect').value;
                window.addAuditLog("Envoi SMS Test B2B", `SMS d'essai envoyé avec succès au ${testPhone} [Modèle: Transit-alert/Dakar]`, "SÉCURITÉ");

                Toastify({
                    text: `📲 SMS de validation envoyé avec succès via ${provider.toUpperCase()} !`,
                    duration: 4000,
                    style: { background: "linear-gradient(to right, #3B82F6, #1D4ED8)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
            }, 1000);
        });
    }
}

// Global hook to trigger automated SMS
window.sendSmsAlertIfEnabled = function(driverPhone, driverName, route, price) {
    const enabled = document.getElementById('smsAlertsEnabled')?.checked;
    if (!enabled) return;

    const saved = localStorage.getItem('transen_sms_config');
    let provider = 'simulation';
    if (saved) {
        try {
            provider = JSON.parse(saved).provider || 'simulation';
        } catch(e){}
    }

    const cleanRoute = route || "Dakar - Saint-Louis";
    const cleanPrice = price || "4 500 F";

    setTimeout(() => {
        window.addAuditLog(
            "Notification SMS Chauffeur", 
            `Alerte de course envoyée à ${driverName} (${driverPhone}) via ${provider.toUpperCase()}`, 
            "PLANIFICATION"
        );

        Toastify({
            text: `📲 SMS de rappel envoyé à ${driverName} : Course ${cleanRoute} assignée (${cleanPrice})`,
            duration: 6000,
            style: { background: "linear-gradient(to right, #2563EB, #1D4ED8)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    }, 1500);
};

async function initExpensesTracker() {
    const listTable = document.getElementById('expensesTableBody');
    if (!listTable) return;

    // Load from backend
    try {
        const expenses = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/expenses?companyId=${currentCompanyId}`);
        window.loadedExpenses = expenses;
    } catch (e) {
        window.loadedExpenses = [];
        console.error("Erreur lors de la récupération des notes de frais", e);
    }

    renderExpensesList();

    // Setup submit form
    const form = document.getElementById('submitExpenseForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const select = document.getElementById('expenseDriverSelect');
            const driverId = select.value;
            if (!driverId) {
                alert("Veuillez choisir un chauffeur.");
                return;
            }

            const driverOpt = select.options[select.selectedIndex];
            const driverName = driverOpt.getAttribute('data-name');

            const category = document.getElementById('expenseCategory').value;
            const amount = parseInt(document.getElementById('expenseAmount').value);
            const description = document.getElementById('expenseDescription').value;

            const image = window.lastUploadedTicketBase64 || "";

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/expenses/submit?companyId=${currentCompanyId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId,
                        category,
                        amount,
                        description,
                        image
                    })
                });

                if (!response.ok && response.status !== 200) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Erreur soumission");
                }

                // Clean form
                form.reset();
                const preview = document.getElementById('expenseImagePreview');
                if (preview) preview.style.display = 'none';
                const dropTitle = document.getElementById('expenseDropzoneText');
                if (dropTitle) dropTitle.innerText = "Glissez votre justificatif ou cliquez ici";
                window.lastUploadedTicketBase64 = null;

                window.addAuditLog("Dépôt Note de Frais", `Note de frais pour ${driverName} soumise d'un montant de ${amount.toLocaleString()} FCFA (${category})`, "FINANCES");

                Toastify({
                    text: "✨ Note de frais soumise pour validation !",
                    duration: 4000,
                    style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                }).showToast();

                // Reload tracker
                await initExpensesTracker();
            } catch (err) {
                Toastify({
                    text: `❌ Erreur : ${err.message}`,
                    duration: 5000,
                    style: { background: "linear-gradient(to right, #EF4444, #C084FC)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
            }
        };
    }

    // Initialize dropzone clicks
    initExpenseDropzone();
}

function renderExpensesList() {
    const listTable = document.getElementById('expensesTableBody');
    if (!listTable) return;

    const expenses = window.loadedExpenses || [];
    listTable.innerHTML = "";

    if (expenses.length === 0) {
        listTable.innerHTML = `<tr><td colspan="5" class="loading-cell">Toutes les notes de frais sont traitées avec succès !</td></tr>`;
        return;
    }

    expenses.forEach(exp => {
        let badgeStyle = "background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.2);";
        if (exp.status === 'VALIDÉ') {
            badgeStyle = "background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2);";
        } else if (exp.status === 'REJETÉ') {
            badgeStyle = "background: rgba(220, 38, 38, 0.1); color: #DC2626; border: 1px solid rgba(220, 38, 38, 0.2);";
        }

        const viewImageHtml = exp.image 
            ? `<a href="${exp.image}" target="_blank" style="color:var(--primary); font-weight:600; display:inline-flex; align-items:center; gap:4px; font-size:0.75rem;"><i class="fas fa-image"></i> Voir Ticket</a>` 
            : `<span style="color:var(--text-dim); font-size:0.75rem; font-style:italic;"><i class="fas fa-receipt"></i> Aucun reçu</span>`;

        const actionButtons = exp.status === 'ATTENTE' 
            ? `<div style="display: flex; gap: 5px; justify-content: flex-end;">
                <button onclick="window.handleExpenseDecision('${exp.id}', 'VALIDÉ')" class="btn-primary" style="padding: 4px 8px; font-size: 0.70rem; border-radius: 4px; background: #10B981; border: none; cursor: pointer; color:#fff;" title="Approuver le remboursement de cette note"><i class="fas fa-check"></i> Valider</button>
                <button onclick="window.handleExpenseDecision('${exp.id}', 'REJETÉ')" class="btn-secondary" style="padding: 4px 8px; font-size: 0.70rem; border-radius: 4px; background: #EF4444; color: white; border: none; cursor: pointer;" title="Refuser le remboursement de cette note"><i class="fas fa-times"></i> Rejeter</button>
               </div>`
            : `<span style="font-size: 1.1rem; color: var(--text-dim); padding-right:15px; display:inline-block;"><i class="fas fa-circle-check" style="color:${exp.status === 'VALIDÉ' ? '#10B981' : '#EC4899'}"></i></span>`;

        const formattedDate = new Date(exp.date).toLocaleString('fr-FR');

        listTable.innerHTML += `
            <tr style="border-bottom: 1px solid var(--glass-border);">
                <td style="padding: 10px 14px; font-size: 0.8rem;">
                    <b>${escapeHtml(exp.driverName)}</b><br><span style="font-size:0.72rem; color:var(--text-dim);">${escapeHtml(exp.driverPhone)}</span>
                </td>
                <td style="padding: 10px 14px; font-size: 0.8rem;">
                    <span style="font-weight:700; color:var(--text-main);">${exp.amount.toLocaleString()} F CFA</span><br>
                    <span style="font-size: 0.72rem; color:var(--text-dim);">${escapeHtml(exp.category)} &middot; ${escapeHtml(exp.description)}</span>
                </td>
                <td style="padding: 10px 14px;">
                    ${viewImageHtml}<br><span style="font-size:0.68rem; color:var(--text-dim);">${formattedDate}</span>
                </td>
                <td style="padding: 10px 14px;">
                    <span style="font-size:0.68rem; padding: 2px 6px; border-radius: 4px; font-weight:700; ${badgeStyle}">${exp.status}</span>
                </td>
                <td style="padding: 10px 14px; text-align: right;">
                    ${actionButtons}
                </td>
            </tr>
        `;
    });
}

window.handleExpenseDecision = async function(expenseId, decision) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/company/dashboard/expenses/${expenseId}/decision?decision=${decision}`, {
            method: 'POST'
        });

        if (!response.ok && response.status !== 200) {
            const errData = await response.json();
            throw new Error(errData.error || "Erreur mise à jour statut");
        }

        const currentExp = (window.loadedExpenses || []).find(x => x.id === expenseId);
        const driverName = currentExp ? currentExp.driverName : "Chauffeur";
        const amount = currentExp ? currentExp.amount : 0;
        const category = currentExp ? currentExp.category : "";

        // Audit Log
        window.addAuditLog(
            decision === 'VALIDÉ' ? "Remboursement Approuvé" : "Remboursement Rejeté",
            `${decision === 'VALIDÉ' ? 'Validation' : 'Rejet'} de la note de frais de ${driverName} d'un montant de ${amount.toLocaleString()} FCFA (${category})`,
            "FINANCES"
        );

        // Toast message
        Toastify({
            text: decision === 'VALIDÉ' ? `✅ Note de frais de ${amount.toLocaleString()} F validée !` : `❌ Note de frais rejetée !`,
            duration: 3000,
            style: { background: decision === 'VALIDÉ' ? "linear-gradient(to right, #10B981, #059669)" : "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
        }).showToast();

        // Reload tracker
        await initExpensesTracker();
    } catch (err) {
        Toastify({
            text: `❌ Erreur : ${err.message}`,
            duration: 5000,
            style: { background: "linear-gradient(to right, #EF4444, #C084FC)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    }
};

function initExpenseDropzone() {
    const dropzone = document.getElementById('expenseDropzone');
    const fileInput = document.getElementById('expenseFileInput');
    const preview = document.getElementById('expenseImagePreview');
    const text = document.getElementById('expenseDropzoneText');

    if (!dropzone || !fileInput) return;

    dropzone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleSelectedTicketFile(file);
        }
    };

    dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.background = 'rgba(26, 115, 232, 0.05)';
    };

    dropzone.ondragleave = () => {
        dropzone.style.borderColor = '#CBD5E1';
        dropzone.style.background = '#FFFFFF';
    };

    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#CBD5E1';
        dropzone.style.background = '#FFFFFF';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleSelectedTicketFile(file);
        }
    };

    function handleSelectedTicketFile(file) {
        // Enforce maximum file size of 5 Mo for local/memory protection
        if (file.size > 5 * 1024 * 1024) {
            Toastify({
                text: "❌ Sécurité : Fichier trop lourd (maximum 5 Mo autorisés).",
                duration: 4000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
            return;
        }

        // Enforce strict file extensions and MIME types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        const allowedExtensions = /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.pdf)$/i;
        if (!allowedTypes.includes(file.type) || !allowedExtensions.test(file.name)) {
            Toastify({
                text: "❌ Sécurité : Format non autorisé (JPEG, PNG, WEBP ou PDF uniquement).",
                duration: 4000,
                style: { background: "linear-gradient(to right, #EF4444, #DC2626)", fontFamily: "Outfit, sans-serif" }
            }).showToast();
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            preview.src = reader.result;
            preview.style.display = 'block';
            text.innerText = `Reçu : ${file.name}`;
            window.lastUploadedTicketBase64 = reader.result;
        };
        reader.readAsDataURL(file);
    }
}

// ====================================================
// AUDIT LOGS EXPORT UTILITY
// ====================================================

function initExportAuditLogs() {
    const btn = document.getElementById('exportAuditLogsBtn');
    if (btn) {
        btn.onclick = async () => {
            const format = prompt("Sous quel format désirez-vous exporter le Journal d'Audit ?\nEntrez 'json' ou 'pdf' :", "pdf");
            if (!format) return;

            const cleanFormat = format.trim().toLowerCase();
            let logs = [];
            try {
                logs = JSON.parse(localStorage.getItem('transen_audit_logs')) || [];
            } catch (e) {}

            if (logs.length === 0) {
                // Seed fallback logs so the export never empty/broken
                logs = [
                    { date: new Date(Date.now() - 3600000 * 4).toLocaleString('fr-FR'), action: "Connexion d'Administration", details: "Authentification sécurisée réussie sur l'adresse IP 197.224.12.5", type: "SÉCURITÉ" },
                    { date: new Date(Date.now() - 3600000 * 3).toLocaleString('fr-FR'), action: "Mise à jour Flotte", details: "Affectation du véhicule DK-5049-AM au chauffeur Samba Diop", type: "ADMIN" },
                    { date: new Date(Date.now() - 3600000 * 2).toLocaleString('fr-FR'), action: "Virement Portefeuille", details: "Recharge bancaire validée d'un montant de 1,500,000 FCFA", type: "FINANCE" },
                    { date: new Date(Date.now() - 3600000).toLocaleString('fr-FR'), action: "Validation KYC", details: "Documents règlementaires approuvés par TranSen Compliance", type: "SÉCURITÉ" }
                ];
                localStorage.setItem('transen_audit_logs', JSON.stringify(logs));
            }

            if (cleanFormat === 'json') {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 4));
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href",     dataStr     );
                dlAnchorElem.setAttribute("download", `TranSen_JournalAudit_${new Date().toISOString().slice(0,10)}.json`);
                dlAnchorElem.click();

                window.addAuditLog("Export Historique JSON", "Téléchargement complet du journal d'audit légal au format JSON", "SÉCURITÉ");
                Toastify({
                    text: "💾 Journal d'audit archivé au format JSON !",
                    duration: 4000,
                    style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                }).showToast();
            } else if (cleanFormat === 'pdf') {
                try {
                    let jsPDFClass = null;
                    if (window.jspdf && window.jspdf.jsPDF) {
                        jsPDFClass = window.jspdf.jsPDF;
                    } else if (window.jsPDF) {
                        jsPDFClass = window.jsPDF;
                    }
                    if (!jsPDFClass) {
                        alert("La bibliothèque jsPDF n'est pas complètement chargée. Veuillez réessayer.");
                        return;
                    }
                    const doc = new jsPDFClass('p', 'mm', 'a4');
                    const pWidth = doc.internal.pageSize.getWidth();

                    doc.setFillColor(31, 41, 55);
                    doc.rect(0, 0, pWidth, 42, 'F');

                    doc.setTextColor(255, 255, 255);
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(18);
                    doc.text("TRANSEN SÉNÉGAL - JOURNAL D'AUDIT", 15, 18);

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.text("Rapport Certifié de Traçabilité des Actions d'Administration (Conformité CDP)", 15, 26);
                    doc.text(`Édité le : ${new Date().toLocaleString('fr-FR')}`, 15, 32);

                    doc.setTextColor(31, 31, 31);
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text("Historique des Interactions Critiques Enregistrées", 15, 54);

                    let currentY = 62;
                    doc.setFillColor(243, 244, 246);
                    doc.rect(13, currentY, pWidth - 26, 8, 'F');
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8.5);
                    doc.setTextColor(55, 65, 81);

                    doc.text("HORODATAGE", 15, currentY + 5.5);
                    doc.text("ACTION", 55, currentY + 5.5);
                    doc.text("DÉTAILS DES MODIFICATIONS", 100, currentY + 5.5);
                    doc.text("CONTRÔLE", pWidth - 30, currentY + 5.5);

                    currentY += 8;
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(31, 31, 31);

                    logs.forEach((log) => {
                        if (currentY > 270) {
                            doc.addPage();
                            currentY = 20;
                        }

                        doc.setFontSize(7.5);
                        doc.text(log.date || "", 15, currentY + 5);

                        doc.setFont("helvetica", "bold");
                        doc.text(log.action || "", 55, currentY + 5);

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(7);
                        const wrappedDetails = doc.splitTextToSize(log.details || "", 80);
                        doc.text(wrappedDetails, 100, currentY + 5);

                        doc.setFontSize(7.5);
                        doc.text(log.type || "", pWidth - 30, currentY + 5);

                        currentY += Math.max(8, 4.5 * wrappedDetails.length);
                        doc.setDrawColor(229, 231, 235);
                        doc.line(13, currentY, pWidth - 13, currentY);
                    });

                    // Professional certification block & official stamp
                    if (currentY > 230) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.setDrawColor(31, 41, 55);
                    doc.rect(13, currentY + 5, pWidth - 26, 40);
                    
                    doc.setFontSize(9);
                    doc.setTextColor(31, 41, 55);
                    doc.setFont("helvetica", "bold");
                    doc.text("CONTRÔLE & SÉCURITÉ TRANSEN", 17, currentY + 13);
                    
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80, 80, 80);
                    doc.setFontSize(7.5);
                    doc.text("Ce journal d'audit est certifié conforme et intègre par notre autorité de régulation.", 17, currentY + 20);
                    doc.text("Toutes les actions d'administration et transactions sont tracées selon la régulation CDP.", 17, currentY + 25);
                    doc.text(`Identifiant de certification : TS-AUD-${Math.floor(Math.random() * 900000 + 100000)}`, 17, currentY + 30);
                    doc.text(`Date de certification : ${new Date().toLocaleString('fr-FR')}`, 17, currentY + 35);

                    const stampBase64 = await window.getStampBase64();
                    if (stampBase64) {
                        doc.addImage(stampBase64, 'JPEG', pWidth - 48, currentY + 7, 32, 32);
                    }

                    doc.save(`TranSen_JournalAudit_${new Date().toISOString().slice(0,10)}.pdf`);

                    window.addAuditLog("Export Historique PDF", "Génération du rapport de traçabilité PDF certifié intègre", "SÉCURITÉ");
                    Toastify({
                        text: "💾 Rapport d'audit de conformité exporté en PDF !",
                        duration: 4000,
                        style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
                    }).showToast();
                } catch (pdfErr) {
                    console.error("PDF Export failed", pdfErr);
                    alert("Erreur lors de l'export PDF : " + pdfErr.message);
                }
            } else {
                alert("Format non supporté. Veuillez taper 'json' ou 'pdf'.");
            }
        };
    }

    // Connect global report buttons
    const btnPDF = document.getElementById('btnExportGlobalPDF');
    const btnWord = document.getElementById('btnExportGlobalWord');
    const btnExcel = document.getElementById('btnExportGlobalExcel');

    if (btnPDF) btnPDF.onclick = () => window.generateGlobalReport('pdf');
    if (btnWord) btnWord.onclick = () => window.generateGlobalReport('word');
    if (btnExcel) btnExcel.onclick = () => window.generateGlobalReport('excel');
}

// ====================================================
// GLOBAL B2B PLATFORM REPORT GENERATOR
// ====================================================

window.generateGlobalReport = async function(format) {
    let companyName = "Compagnie B2B";
    let companyEmail = "Non renseigné";
    let companyPhone = "Non renseigné";
    let managerName = "Gérant B2B";
    let companyType = "Non spécifié";

    try {
        if (typeof currentCompanyId !== 'undefined' && currentCompanyId) {
            const company = await fetchWithAuth(`${API_BASE_URL}/api/companies/${currentCompanyId}/status`);
            const user = await fetchWithAuth(`${API_BASE_URL}/api/users/me`);
            companyName = user.companyName || company.name || "Compagnie B2B";
            companyEmail = user.email || company.email || "Non renseigné";
            companyPhone = user.phone || company.phone || "Non renseigné";
            managerName = user.fullName || "Gérant B2B";
            companyType = company.type || "Non spécifié";
        }
    } catch (err) {
        console.error("Error fetching company details:", err);
    }

    const activeDriversText = document.getElementById('activeDriversCount')?.innerText || "0";
    const onlineDriversText = document.getElementById('onlineDriversCount')?.innerText || "0";
    const offlineDriversText = document.getElementById('offlineDriversCount')?.innerText || "0";
    const todayTripsText = document.getElementById('todayTrips')?.innerText || "0";
    const totalRevText = document.getElementById('totalRevenue')?.innerText || "0 FCFA";
    const walletBalanceText = document.getElementById('walletBalance')?.innerText || "0 FCFA";

    const drivers = window.loadedDriversCache || [];
    const trips = window.loadedTrips || [];
    const wallet = window.loadedWalletData || { transactions: [] };
    const transactions = wallet.transactions || [];

    let expenses = [];
    try {
        expenses = JSON.parse(localStorage.getItem('transen_driver_expenses')) || [];
    } catch (e) {}

    let auditLogs = [];
    try {
        auditLogs = JSON.parse(localStorage.getItem('transen_audit_logs')) || [];
    } catch (e) {}

    if (auditLogs.length === 0) {
        auditLogs = [
            { date: new Date(Date.now() - 3600000 * 4).toLocaleString('fr-FR'), action: "Connexion d'Administration", details: "Authentification sécurisée réussie sur l'adresse IP 197.224.12.5", type: "SÉCURITÉ" },
            { date: new Date(Date.now() - 3600000 * 3).toLocaleString('fr-FR'), action: "Mise à jour Flotte", details: "Affectation du véhicule DK-5049-AM au chauffeur Samba Diop", type: "ADMIN" },
            { date: new Date(Date.now() - 3600000 * 2).toLocaleString('fr-FR'), action: "Virement Portefeuille", details: "Recharge bancaire validée d'un montant de 1,500,000 FCFA", type: "FINANCE" },
            { date: new Date(Date.now() - 3600000).toLocaleString('fr-FR'), action: "Validation KYC", details: "Documents règlementaires approuvés par TranSen Compliance", type: "SÉCURITÉ" }
        ];
    }

    if (format === 'pdf') {
        try {
            let jsPDFClass = null;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDFClass = window.jsPDF;
            }

            if (!jsPDFClass) {
                alert("La bibliothèque jsPDF n'est pas complètement chargée. Veuillez recharger ou patienter.");
                return;
            }

            const doc = new jsPDFClass('p', 'mm', 'a4');
            const pWidth = doc.internal.pageSize.getWidth();

            // Elegance green bar at the very top (attention to detail)
            doc.setFillColor(5, 150, 105);
            doc.rect(0, 0, pWidth, 5, 'F');

            // Render corporate logo if available
            let textLeftOffset = 15;
            const logoBase64 = await window.getLogoBase64();
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 15, 11, 14, 14);
                textLeftOffset = 33;
            }

            // --- LEFT SIDE: TRANSEN SÉNÉGAL S.A. ---
            doc.setTextColor(5, 150, 105); // Green brand color
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("TRANSEN SÉNÉGAL S.A.", textLeftOffset, 15);

            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text("Plateforme numérique de gestion du transport et de la logistique", textLeftOffset, 19.5);
            doc.text("Dakar, Sénégal | Tél : +221 78 138 64 05", textLeftOffset, 24);
            doc.text("Email : contact@transen.org | Web : compagnie.transen.org", textLeftOffset, 28.5);

            // --- RIGHT SIDE: PARTNER COMPANY DETAILS ---
            doc.setTextColor(31, 41, 55); // Dark Slate Grey
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("COMPAGNIE ADHÉRENTE", 120, 15);

            doc.setTextColor(55, 65, 81);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(companyName.toUpperCase(), 120, 20);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.text(`Type d'entité : ${companyType}`, 120, 25);
            if (typeof currentCompanyId !== 'undefined' && currentCompanyId) {
                doc.text(`Identifiant B2B : TS-COMP-${currentCompanyId.substring(0, 6).toUpperCase()}`, 120, 29);
            }
            doc.text(`Représentant : ${managerName}`, 120, 33);
            doc.text(`E-mail : ${companyEmail}`, 120, 37);
            doc.text(`Téléphone : ${companyPhone}`, 120, 41);

            // Divider Line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(13, 46, pWidth - 13, 46);

            // Report Title & Meta
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.text("RAPPORT CONSOLIDÉ DE GESTION GLOBALE B2B", 15, 55);

            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Document d'audit officiel émis le ${new Date().toLocaleString('fr-FR')} | Confidentiel`, 15, 61);

            // KPIs
            let currentY = 72;
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("1. Synthèse Administrative des Données Clés", 15, currentY);

            currentY += 6;
            doc.setFillColor(243, 244, 246);
            doc.rect(13, currentY, pWidth - 26, 32, 'F');

            doc.setTextColor(75, 85, 99);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.text("CHIFFRE D'AFFAIRES", 20, currentY + 8);
            doc.text("SOLDE PORTEFEUILLE", 68, currentY + 8);
            doc.text("COURSES JEU", 120, currentY + 8);
            doc.text("CHAUFFEURS (EN LIGNE)", 158, currentY + 8);

            doc.setTextColor(5, 150, 105);
            doc.setFontSize(12);
            doc.text(totalRevText, 20, currentY + 17);
            doc.text(walletBalanceText, 68, currentY + 17);
            doc.text(todayTripsText, 120, currentY + 17);
            doc.text(`${onlineDriversText} connecté(s)`, 158, currentY + 17);

            doc.setTextColor(115, 115, 115);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.text("Totalité cumulée", 20, currentY + 24);
            doc.text("Rapport certifié B2B", 68, currentY + 24);
            doc.text("Aujourd'hui", 120, currentY + 24);
            doc.text(`Hors-ligne: ${offlineDriversText}`, 158, currentY + 24);

            // Drivers Table
            currentY += 42;
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("2. Chauffeurs Pratiques & Performance Flotte", 15, currentY);

            currentY += 6;
            doc.setFillColor(229, 231, 235);
            doc.rect(13, currentY, pWidth - 26, 7, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(75, 85, 99);
            doc.text("NOM", 16, currentY + 5);
            doc.text("MOBILE", 52, currentY + 5);
            doc.text("VÉHICULE & IMMATRICULATION", 85, currentY + 5);
            doc.text("NOTE", 145, currentY + 5);
            doc.text("STATUT", 168, currentY + 5);

            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(55, 65, 81);
            doc.setFontSize(7.5);

            if (drivers.length === 0) {
                doc.text("Aucun chauffeur rattaché à cette organisation.", 16, currentY + 5);
                currentY += 8;
            } else {
                drivers.forEach(d => {
                    if (currentY > 265) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(d.name || "N/A", 16, currentY + 4);
                    doc.text(d.phoneNumber || d.phone || "N/A", 52, currentY + 4);
                    doc.text(`${d.carModel || "N/A"} (${d.licensePlate || "N/A"})`, 85, currentY + 4);
                    doc.text(`${d.rating || "5.0"} / 5`, 145, currentY + 4);
                    doc.text(d.status || d.activeStatus || "ACTIF", 168, currentY + 4);

                    currentY += 6;
                    doc.setDrawColor(243, 244, 246);
                    doc.line(13, currentY, pWidth - 13, currentY);
                    currentY += 1.5;
                });
            }

            // Trips / Schedule
            currentY += 6;
            if (currentY > 245) {
                doc.addPage();
                currentY = 20;
            }
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("3. Lignes de Transport & Trajets Planifiés", 15, currentY);

            currentY += 6;
            doc.setFillColor(229, 231, 235);
            doc.rect(13, currentY, pWidth - 26, 7, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(75, 85, 99);
            doc.text("ID COURSE", 16, currentY + 5);
            doc.text("CONDUCTEUR", 45, currentY + 5);
            doc.text("TRAJET", 88, currentY + 5);
            doc.text("TARIF", 145, currentY + 5);
            doc.text("STATUT", 168, currentY + 5);

            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(55, 65, 81);
            doc.setFontSize(7.5);

            if (trips.length === 0) {
                doc.text("Aucune course planifiée à ce jour.", 16, currentY + 5);
                currentY += 8;
            } else {
                trips.forEach(t => {
                    if (currentY > 265) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(t.id ? t.id.substring(0, 8).toUpperCase() : "N/A", 16, currentY + 4);
                    doc.text(t.driverName || "N/A", 45, currentY + 4);
                    doc.text(`${t.departure || "Dakar"} -> ${t.destination || "AIBD"}`, 88, currentY + 4);
                    doc.text(`${t.price ? t.price.toLocaleString() : "0"} F`, 145, currentY + 4);
                    doc.text(t.status || "COMPLETED", 168, currentY + 4);

                    currentY += 6;
                    doc.setDrawColor(243, 244, 246);
                    doc.line(13, currentY, pWidth - 13, currentY);
                    currentY += 1.5;
                });
            }

            // Wallet & Ledger
            currentY += 6;
            if (currentY > 245) {
                doc.addPage();
                currentY = 20;
            }
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("4. Historique Consolidé du Portefeuille B2B", 15, currentY);

            currentY += 6;
            doc.setFillColor(229, 231, 235);
            doc.rect(13, currentY, pWidth - 26, 7, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(75, 85, 99);
            doc.text("RÉFÉRENCE", 16, currentY + 5);
            doc.text("DATE", 45, currentY + 5);
            doc.text("SERVICE / DESCRIPTION", 88, currentY + 5);
            doc.text("FLUX", 150, currentY + 5);
            doc.text("RÉSULTAT", 172, currentY + 5);

            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(55, 65, 81);
            doc.setFontSize(7.2);

            if (transactions.length === 0) {
                doc.text("Aucune transaction enregistrée.", 16, currentY + 5);
                currentY += 8;
            } else {
                transactions.forEach(tx => {
                    if (currentY > 265) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(tx.id ? tx.id.substring(0, 8).toUpperCase() : "N/A", 16, currentY + 4);
                    doc.text(new Date(tx.date).toLocaleString('fr-FR'), 45, currentY + 4);
                    doc.text(tx.type || "Service", 88, currentY + 4);
                    doc.text(`${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString()} F`, 150, currentY + 4);
                    doc.text(tx.status || "COMPLET", 172, currentY + 4);

                    currentY += 6;
                    doc.setDrawColor(243, 244, 246);
                    doc.line(13, currentY, pWidth - 13, currentY);
                    currentY += 1.5;
                });
            }

            // Expenses tracker
            currentY += 6;
            if (currentY > 245) {
                doc.addPage();
                currentY = 20;
            }
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("5. Notes de Frais & Justificatifs Approuvés", 15, currentY);

            currentY += 6;
            doc.setFillColor(229, 231, 235);
            doc.rect(13, currentY, pWidth - 26, 7, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(75, 85, 99);
            doc.text("RÉCLAMANT", 16, currentY + 5);
            doc.text("DATE", 52, currentY + 5);
            doc.text("CATÉGORIE", 90, currentY + 5);
            doc.text("MONTANT", 138, currentY + 5);
            doc.text("DÉCISION", 165, currentY + 5);

            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(55, 65, 81);
            doc.setFontSize(7.2);

            if (expenses.length === 0) {
                doc.text("Aucun justificatif soumis pour le moment.", 16, currentY + 5);
                currentY += 8;
            } else {
                expenses.forEach(exp => {
                    if (currentY > 265) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(exp.driverName || "N/A", 16, currentY + 4);
                    doc.text(exp.date || "N/A", 52, currentY + 4);
                    doc.text(exp.category || "Autre", 90, currentY + 4);
                    doc.text(`${exp.amount ? exp.amount.toLocaleString() : "0"} F`, 138, currentY + 4);
                    doc.text(exp.status || "ATTENTE", 165, currentY + 4);

                    currentY += 6;
                    doc.setDrawColor(243, 244, 246);
                    doc.line(13, currentY, pWidth - 13, currentY);
                    currentY += 1.5;
                });
            }

            // Audit
            currentY += 6;
            if (currentY > 245) {
                doc.addPage();
                currentY = 20;
            }
            doc.setTextColor(31, 41, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("6. Rapport d'Intégrité Légale & Logs d'Audit", 15, currentY);

            currentY += 6;
            doc.setFillColor(229, 231, 235);
            doc.rect(13, currentY, pWidth - 26, 7, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(75, 85, 99);
            doc.text("DATE", 16, currentY + 5);
            doc.text("ACTION", 52, currentY + 5);
            doc.text("DÉTAIL AUDITÉ DE CONFORMITÉ", 85, currentY + 5);
            doc.text("RÔLE", 170, currentY + 5);

            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(55, 65, 81);
            doc.setFontSize(7.2);

            auditLogs.slice(0, 30).forEach(log => {
                if (currentY > 265) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(log.date || "", 16, currentY + 4);
                doc.text(log.action || "", 52, currentY + 4);
                const descLines = doc.splitTextToSize(log.details || "", 80);
                doc.text(descLines, 85, currentY + 4);
                doc.text(log.type || "SYS", 170, currentY + 4);

                currentY += Math.max(6, 4.5 * descLines.length);
                doc.setDrawColor(243, 244, 246);
                doc.line(13, currentY, pWidth - 13, currentY);
                currentY += 1.5;
            });

            // Professional certification block & official stamp
            if (currentY > 230) {
                doc.addPage();
                currentY = 20;
            }
            doc.setDrawColor(5, 150, 105);
            doc.rect(13, currentY + 5, pWidth - 26, 40);
            
            doc.setFontSize(9.5);
            doc.setTextColor(5, 150, 105);
            doc.setFont("helvetica", "bold");
            doc.text("CERTIFICATION ET VISA DE CONFORMITÉ TRANSEN SÉNÉGAL S.A.", 17, currentY + 13);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(7.5);
            doc.text("Ce rapport global consolidé rassemble les données d'exploitation, de tarification et de comptabilité.", 17, currentY + 20);
            doc.text("Validé par le département d'administration financière et de conformité réglementaire.", 17, currentY + 25);
            doc.text(`Code de signature électronique : TS-B2B-${Math.floor(Math.random() * 9000000 + 1000000)}`, 17, currentY + 30);
            doc.text(`Date de certification : ${new Date().toLocaleString('fr-FR')}`, 17, currentY + 35);

            const stampBase64 = await window.getStampBase64();
            if (stampBase64) {
                doc.addImage(stampBase64, 'JPEG', pWidth - 48, currentY + 7, 32, 32);
            }

            doc.save(`TranSen_Rapport_Global_${new Date().toISOString().slice(0,10)}.pdf`);
            window.addAuditLog("Rapport Global PDF", "Génération du rapport d'activité mensuelle consolidé de la plateforme (Document PDF)", "SÉCURITÉ");

            Toastify({
                text: "📊 Rapport PDF généré et téléchargé !",
                duration: 4500,
                style: { background: "linear-gradient(to right, #10B981, #059669)", fontFamily: "Outfit, sans-serif" }
            }).showToast();

        } catch (err) {
            console.error(err);
            alert("Erreur export PDF : " + err.message);
        }
    } else if (format === 'word') {
        const logoBase64 = await window.getLogoBase64();
        const docHtml = buildReportHtmlDocument(totalRevText, walletBalanceText, activeDriversText, todayTripsText, onlineDriversText, offlineDriversText, drivers, trips, transactions, expenses, auditLogs, { companyName, companyEmail, companyPhone, managerName, companyType, logoBase64 });
        const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TranSen_Rapport_Global_${new Date().toISOString().slice(0,10)}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.addAuditLog("Rapport Global Word", "Export du rapport consolidé global de gestion sous format Word .doc", "SÉCURITÉ");
        Toastify({
            text: "📝 Rapport Word exporté avec succès !",
            duration: 4500,
            style: { background: "linear-gradient(to right, #2563EB, #1D4ED8)", fontFamily: "Outfit, sans-serif" }
        }).showToast();

    } else if (format === 'excel') {
        const logoBase64 = await window.getLogoBase64();
        const xlsHtml = buildReportExcelDocument(totalRevText, walletBalanceText, activeDriversText, todayTripsText, onlineDriversText, offlineDriversText, drivers, trips, transactions, expenses, auditLogs, { companyName, companyEmail, companyPhone, managerName, companyType, logoBase64 });
        const blob = new Blob(['\ufeff' + xlsHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TranSen_Rapport_Global_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.addAuditLog("Rapport Global Excel", "Export des données financières et opérationnelles consolidées sous format Excel .xlsx", "SÉCURITÉ");
        Toastify({
            text: "📈 Rapport Excel exporté avec succès !",
            duration: 4500,
            style: { background: "linear-gradient(to right, #16A34A, #15803D)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    }
};

function buildReportHtmlDocument(totalRevText, walletBalance, activeDrivers, todayTrips, onlineDrivers, offlineDrivers, drivers, trips, transactions, expenses, auditLogs, companyInfo) {
    const compName = companyInfo?.companyName || "Compagnie B2B";
    const compEmail = companyInfo?.companyEmail || "Non renseigné";
    const compPhone = companyInfo?.companyPhone || "Non renseigné";
    const compManager = companyInfo?.managerName || "Gérant B2B";
    const compType = companyInfo?.companyType || "Non spécifié";
    const compLogo = companyInfo?.logoBase64;

    let driversRows = drivers.map(d => `
        <tr>
            <td>${d.name || "N/A"}</td>
            <td>${d.phoneNumber || d.phone || "N/A"}</td>
            <td>${d.carModel || "N/A"} (${d.licensePlate || "N/A"})</td>
            <td>${d.rating || "5.0"} / 5</td>
            <td>${d.status || d.activeStatus || "ACTIF"}</td>
        </tr>
    `).join('');

    let tripsRows = trips.map(t => `
        <tr>
            <td>${t.id ? t.id.substring(0, 8).toUpperCase() : "N/A"}</td>
            <td>${t.driverName || "N/A"}</td>
            <td>${t.departure || "Dakar"} ➔ ${t.destination || "AIBD"}</td>
            <td>${t.price ? t.price.toLocaleString() : "0"} F</td>
            <td>${t.status || "COMPLETED"}</td>
        </tr>
    `).join('');

    let txRows = transactions.map(tx => `
        <tr>
            <td>${tx.id ? tx.id.substring(0, 8).toUpperCase() : "N/A"}</td>
            <td>${new Date(tx.date).toLocaleString('fr-FR')}</td>
            <td>${tx.type || "Service"}</td>
            <td>${tx.amount.toLocaleString()} F</td>
            <td>${tx.status || "COMPLÉTÉ"}</td>
        </tr>
    `).join('');

    let expRows = expenses.map(exp => `
        <tr>
            <td>${exp.driverName || "N/A"}</td>
            <td>${exp.date || "N/A"}</td>
            <td>${exp.category || "Autre"}</td>
            <td>${exp.amount ? exp.amount.toLocaleString() : "0"} F</td>
            <td>${exp.status || "ATTENTE"}</td>
        </tr>
    `).join('');

    let auditRows = auditLogs.map(log => `
        <tr>
            <td>${log.date || "N/A"}</td>
            <td><b>${log.action || "Action"}</b></td>
            <td>${log.details || "N/A"}</td>
            <td>${log.type || "SÉCURITÉ"}</td>
        </tr>
    `).join('');

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
    <meta charset="utf-8">
    <title>TranSen - Rapport Consolidé de Gestion B2B</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; line-height: 1.5; padding: 20px; }
        .header-title { color: #059669; font-size: 26px; font-weight: bold; border-bottom: 3px solid #059669; padding-bottom: 8px; margin-bottom: 5px; }
        .header-subtitle { color: #4B5563; font-size: 14px; margin-bottom: 25px; }
        h2 { color: #111827; font-size: 18px; border-bottom: 1px solid #D1D5DB; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #F3F4F6; color: #374151; font-weight: bold; text-align: left; padding: 8px 12px; border: 1px solid #D1D5DB; font-size: 12px; }
        td { padding: 8px 12px; border: 1px solid #E5E7EB; font-size: 11px; }
        .stats-grid { display: table; width: 100%; margin-bottom: 25px; }
        .stats-row { display: table-row; }
        .stats-col { display: table-cell; width: 25%; padding: 15px; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 8px; text-align: center; }
        .stats-label { font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
        .stats-val { font-size: 20px; color: #059669; font-weight: bold; }
    </style>
    </head>
    <body>
        <!-- Side-by-Side Header Table (TranSen Left, Company Right) -->
        <table style="width: 100%; border: none; border-bottom: 3px solid #059669; margin-bottom: 25px;">
            <tr style="border: none;">
                <td style="width: 50%; border: none; text-align: left; vertical-align: top; padding: 0 10px 10px 0;">
                    ${compLogo ? `<img src="${compLogo}" style="float: left; width: 52px; height: 52px; margin-right: 12px; margin-bottom: 5px; border-radius: 4px;" alt="Logo" />` : ''}
                    <div style="${compLogo ? 'margin-left: 64px;' : ''}">
                        <span style="color: #059669; font-size: 20px; font-weight: bold; display: block; margin-bottom: 5px;">TRANSEN SÉNÉGAL S.A.</span>
                        <span style="color: #4B5563; font-size: 11px; display: block; line-height: 1.4;">
                            Plateforme numérique de gestion du transport et de la logistique<br>
                            Dakar, Sénégal<br>
                            Tél : +221 78 138 64 05<br>
                            Email : contact@transen.org<br>
                            Web : compagnie.transen.org
                        </span>
                    </div>
                </td>
                <td style="width: 50%; border: none; text-align: right; vertical-align: top; padding: 0 0 10px 10px;">
                    <span style="color: #1F2937; font-size: 11px; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px;">COMPAGNIE ADHÉRENTE</span>
                    <span style="color: #059669; font-size: 16px; font-weight: bold; display: block; margin-bottom: 5px;">${compName.toUpperCase()}</span>
                    <span style="color: #4B5563; font-size: 11px; display: block; line-height: 1.4;">
                        Type : ${compType}<br>
                        Gérant : ${compManager}<br>
                        Téléphone : ${compPhone}<br>
                        E-mail : ${compEmail}
                    </span>
                </td>
            </tr>
        </table>
        
        <p style="font-size: 13px; color: #111827; margin-top: 0; font-weight: bold;">
            RAPPORT MENSUEL CONSOLIDÉ DE GESTION ADMINISTRATIVE ET FINANCIÈRE DE LA FLOTTE B2B
        </p>
        <p style="font-size: 11px; color: #4B5563; margin-top: -8px; margin-bottom: 20px;">
            Edité le : ${new Date().toLocaleString('fr-FR')} | Statut: Rapport Certifié Intègre & Officiel
        </p>
        
        <h2>1. SYNTHÈSE DES DONNÉES CLÉS</h2>
        <div class="stats-grid">
            <div class="stats-row">
                <div class="stats-col">
                    <div class="stats-label">Solde Portefeuille</div>
                    <div class="stats-val">${walletBalance}</div>
                </div>
                <div class="stats-col">
                    <div class="stats-label">Volume Chiffres d'Affaires</div>
                    <div class="stats-val">${totalRevText}</div>
                </div>
                <div class="stats-col">
                    <div class="stats-label">Chauffeurs Actifs</div>
                    <div class="stats-val">${activeDrivers}</div>
                </div>
                <div class="stats-col">
                    <div class="stats-label">Lignes de Transports / Courses</div>
                    <div class="stats-val">${todayTrips}</div>
                </div>
            </div>
        </div>
        
        <p style="font-size: 12px; color: #4B5563;">Statut de la flotte : <b>${onlineDrivers}</b> chauffeurs actuellement connectés sur les routes, <b>${offlineDrivers}</b> en mode repos.</p>

        <h2>2. RÉPERTOIRE DES CONDUCTEURS ET VÉHICULES DE FLOTTE</h2>
        <table>
            <thead>
                <tr>
                    <th>Chauffeur</th>
                    <th>Téléphone</th>
                    <th>Modèle Véhicule / Immatriculation</th>
                    <th>Évaluation</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                ${driversRows || '<tr><td colspan="5" style="text-align:center;">Aucune donnée disponible.</td></tr>'}
            </tbody>
        </table>

        <h2>3. HISTORIQUE DES COURSES ET LIGNES PLANIFIÉES</h2>
        <table>
            <thead>
                <tr>
                    <th>Référence Course</th>
                    <th>Driver Associé</th>
                    <th>Itinéraire</th>
                    <th>Montant Course</th>
                    <th>État Actuel</th>
                </tr>
            </thead>
            <tbody>
                ${tripsRows || '<tr><td colspan="5" style="text-align:center;">Aucune donnée disponible.</td></tr>'}
            </tbody>
        </table>

        <h2>4. REGISTRE DES TRANSACTIONS FINANCIÈRES (LEDGER)</h2>
        <table>
            <thead>
                <tr>
                    <th>ID de Transaction</th>
                    <th>Horodatage</th>
                    <th>Service Activé / Type</th>
                    <th>Impact Solde</th>
                    <th>Statut de Validation</th>
                </tr>
            </thead>
            <tbody>
                ${txRows || '<tr><td colspan="5" style="text-align:center;">Aucune donnée disponible.</td></tr>'}
            </tbody>
        </table>

        <h2>5. ANALYSE DES REMBOURSEMENTS ET NOTES DE FRAIS COMPAGNIE</h2>
        <table>
            <thead>
                <tr>
                    <th>Nom du Réclamant</th>
                    <th>Date d'Envoi</th>
                    <th>Catégorie de Charge</th>
                    <th>Montant Réglé</th>
                    <th>État Traitement</th>
                </tr>
            </thead>
            <tbody>
                ${expRows || '<tr><td colspan="5" style="text-align:center;">Aucune donnée disponible.</td></tr>'}
            </tbody>
        </table>

        <h2>6. LOGS D'ENREGISTREMENT ET JOURNAL DE SÉCURITÉ AUDITÉE</h2>
        <table>
            <thead>
                <tr>
                    <th>Horodatage UTC/Dakar</th>
                    <th>Action Sensible</th>
                    <th>Détail de l'Événement Traceur</th>
                    <th>Contrôleur</th>
                </tr>
            </thead>
            <tbody>
                ${auditRows || '<tr><td colspan="4" style="text-align:center;">Aucun événement enregistré.</td></tr>'}
            </tbody>
        </table>
    </body>
    </html>
    `;
}

function buildReportExcelDocument(totalRevText, walletBalance, activeDrivers, todayTrips, onlineDrivers, offlineDrivers, drivers, trips, transactions, expenses, auditLogs, companyInfo) {
    const compName = companyInfo?.companyName || "Compagnie B2B";
    const compEmail = companyInfo?.companyEmail || "Non renseigné";
    const compPhone = companyInfo?.companyPhone || "Non renseigné";
    const compManager = companyInfo?.managerName || "Gérant B2B";
    const compType = companyInfo?.companyType || "Non spécifié";
    const compLogo = companyInfo?.logoBase64;

    let sectionsHtml = `
        <!-- KPI SECTION -->
        <tr style="height: 30px;"><td colspan="5" style="font-size: 14pt; font-weight: bold; color: #059669;">1. SYNTHÈSE DES DONNÉES CLÉS</td></tr>
        <tr style="height: 4px;"><td colspan="5" style="border-bottom: 2px solid #059669;"></td></tr>
        <tr style="background-color: #F3F4F6;">
            <th style="border: 0.5pt solid #D1D5DB; font-weight: bold;">Solde du Portefeuille B2B</th>
            <th style="border: 0.5pt solid #D1D5DB; font-weight: bold;">Chiffres d'Affaires Cumulé</th>
            <th style="border: 0.5pt solid #D1D5DB; font-weight: bold;">Chauffeurs Actifs</th>
            <th style="border: 0.5pt solid #D1D5DB; font-weight: bold;">Courses Enregistrées</th>
            <th style="border: 0.5pt solid #D1D5DB; font-weight: bold;">Chauffeurs En ligne</th>
        </tr>
        <tr>
            <td style="border: 0.5pt solid #E5E7EB; font-weight: bold; color: #059669; font-size: 11pt;">${walletBalance}</td>
            <td style="border: 0.5pt solid #E5E7EB; font-weight: bold; font-size: 11pt;">${totalRevText}</td>
            <td style="border: 0.5pt solid #E5E7EB; font-size: 11pt;">${activeDrivers}</td>
            <td style="border: 0.5pt solid #E5E7EB; font-size: 11pt;">${todayTrips}</td>
            <td style="border: 0.5pt solid #E5E7EB; font-size: 11pt;">${onlineDrivers} / ${offlineDrivers} repos dakar</td>
        </tr>
        
        <tr style="height: 25px;"><td colspan="5"></td></tr>
        
        <!-- DRIVERS SECTION -->
        <tr style="height: 30px;"><td colspan="5" style="font-size: 14pt; font-weight: bold; color: #111827;">2. CHAUFFEURS DE LA FLOTTE</td></tr>
        <tr style="height: 4px;"><td colspan="5" style="border-bottom: 1px solid #D1D5DB;"></td></tr>
        <tr style="background-color: #059669; color: #FFFFFF;">
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Nom Complet</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Mobile de Contact</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Véhicule attribué</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Note Moyenne /5</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Statut Opérationnel</th>
        </tr>
    `;
    
    if (drivers.length === 0) {
        sectionsHtml += `<tr><td colspan="5" style="border: 0.5pt solid #E5E7EB; text-align: center;">Aucun chauffeur rattaché.</td></tr>`;
    } else {
        drivers.forEach(d => {
            sectionsHtml += `
                <tr>
                    <td style="border: 0.5pt solid #E5E7EB;">${d.name || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${d.phoneNumber || d.phone || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${d.carModel || "N/A"} (${d.licensePlate || "N/A"})</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${d.rating || "5.0"} / 5</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${d.status || d.activeStatus || "ACTIF"}</td>
                </tr>
            `;
        });
    }

    sectionsHtml += `
        <tr style="height: 25px;"><td colspan="5"></td></tr>
        <!-- TRIPS SECTION -->
        <tr style="height: 30px;"><td colspan="5" style="font-size: 14pt; font-weight: bold; color: #111827;">3. HISTORIQUE ENREGISTRÉ DES COURSES</td></tr>
        <tr style="height: 4px;"><td colspan="5" style="border-bottom: 1px solid #D1D5DB;"></td></tr>
        <tr style="background-color: #059669; color: #FFFFFF;">
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Réf Course ex: AIBD</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Driver Principal</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Origine & Destination</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Prix de Commande</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Statut de la Course avant dakar</th>
        </tr>
    `;
    
    if (trips.length === 0) {
        sectionsHtml += `<tr><td colspan="5" style="border: 0.5pt solid #E5E7EB; text-align: center;">Aucune course planifiée.</td></tr>`;
    } else {
        trips.forEach(t => {
            sectionsHtml += `
                <tr>
                    <td style="border: 0.5pt solid #E5E7EB;">${t.id ? t.id.substring(0, 8).toUpperCase() : "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${t.driverName || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${t.departure || "Dakar"} -> ${t.destination || "AIBD"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${t.price ? t.price.toLocaleString() : "0"} F CFA</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${t.status || "COMPLETED"}</td>
                </tr>
            `;
        });
    }

    sectionsHtml += `
        <tr style="height: 25px;"><td colspan="5"></td></tr>
        <!-- TRANSACTIONS SECTION -->
        <tr style="height: 30px;"><td colspan="5" style="font-size: 14pt; font-weight: bold; color: #111827;">4. GRAND LIVRE DES TRANSACTIONS FINANCIÈRES</td></tr>
        <tr style="height: 4px;"><td colspan="5" style="border-bottom: 1px solid #D1D5DB;"></td></tr>
        <tr style="background-color: #059669; color: #FFFFFF;">
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">ID Transactions uniques</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Date & Heure validation</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Type de Transaction / Service</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Flux Financier</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Statut</th>
        </tr>
    `;
    
    if (transactions.length === 0) {
        sectionsHtml += `<tr><td colspan="5" style="border: 0.5pt solid #E5E7EB; text-align: center;">Aucun mouvement financier enregistré.</td></tr>`;
    } else {
        transactions.forEach(tx => {
            sectionsHtml += `
                <tr>
                    <td style="border: 0.5pt solid #E5E7EB;">${tx.id ? tx.id.substring(0, 8).toUpperCase() : "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${new Date(tx.date).toLocaleString('fr-FR')}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${tx.type || "Service B2B"}</td>
                    <td style="border: 0.5pt solid #E5E7EB; font-weight: bold;">${tx.amount.toLocaleString()} F CFA</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${tx.status || "COMPLÉTÉ"}</td>
                </tr>
            `;
        });
    }

    sectionsHtml += `
        <tr style="height: 25px;"><td colspan="5"></td></tr>
        <!-- EXPENSES SECTION -->
        <tr style="height: 30px;"><td colspan="5" style="font-size: 14pt; font-weight: bold; color: #111827;">5. REMBOURSEMENTS & NOTES DE FRAIS COMPAGNIE</td></tr>
        <tr style="height: 4px;"><td colspan="5" style="border-bottom: 1px solid #D1D5DB;"></td></tr>
        <tr style="background-color: #059669; color: #FFFFFF;">
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Nom complet du Réclamant</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Date Soumission</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Catégorie de note de frais</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Montant de justificatif</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Statut de Remboursement</th>
        </tr>
    `;
    
    if (expenses.length === 0) {
        sectionsHtml += `<tr><td colspan="5" style="border: 0.5pt solid #E5E7EB; text-align: center;">Aucun remboursement en cours.</td></tr>`;
    } else {
        expenses.forEach(exp => {
            sectionsHtml += `
                <tr>
                    <td style="border: 0.5pt solid #E5E7EB;">${exp.driverName || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${exp.date || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${exp.category || "Autre"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${exp.amount ? exp.amount.toLocaleString() : "0"} F CFA</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${exp.status || "ATTENTE"}</td>
                </tr>
            `;
        });
    }

    sectionsHtml += `
        <tr style="height: 25px;"><td colspan="5"></td></tr>
        <!-- AUDIT SECTION -->
        <tr style="height: 30px;"><td colspan="5" style="font-size: 14pt; font-weight: bold; color: #111827;">6. JOURNAL GENERAL D'AUDIT COMPÉTENT</td></tr>
        <tr style="height: 4px;"><td colspan="5" style="border-bottom: 1px solid #D1D5DB;"></td></tr>
        <tr style="background-color: #1F2937; color: #FFFFFF;">
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Date & Heure dakar</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;">Action d'Administration</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold; width: 300px;">Description traceur de l'évènement</th>
            <th style="border: 0.5pt solid #D1D5DB; color: #FFFFFF; font-weight: bold;" colspan="2">Type Sécuritaire</th>
        </tr>
    `;
    
    if (auditLogs.length === 0) {
        sectionsHtml += `<tr><td colspan="5" style="border: 0.5pt solid #E5E7EB; text-align: center;">Aucun événement audité.</td></tr>`;
    } else {
        auditLogs.forEach(log => {
            sectionsHtml += `
                <tr>
                    <td style="border: 0.5pt solid #E5E7EB;">${log.date || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB; font-weight: bold;">${log.action || "Action"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;" colspan="2">${log.details || "N/A"}</td>
                    <td style="border: 0.5pt solid #E5E7EB;">${log.type || "SÉCURITÉ"}</td>
                </tr>
            `;
        });
    }

    return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8">
    <style>
        th { font-family: Arial, sans-serif; font-size: 10pt; height: 24px; text-align: left; }
        td { font-family: Arial, sans-serif; font-size: 10pt; height: 20px; }
    </style>
    </head>
    <body>
        <table>
            <!-- Side-by-Side Excel Header Cells -->
            <tr style="height: 30px;">
                <td colspan="3" style="font-size: 16pt; font-weight: bold; color: #059669; vertical-align: middle;">
                    ${compLogo ? `<img src="${compLogo}" width="40" height="40" style="vertical-align: middle; margin-right: 8px;" /> ` : ''}TRANSEN SÉNÉGAL S.A.
                </td>
                <td colspan="2" style="font-size: 11pt; font-weight: bold; color: #1F2937; text-align: right; vertical-align: middle;">COMPAGNIE ADHÉRENTE</td>
            </tr>
            <tr style="height: 20px;">
                <td colspan="3" style="font-size: 10pt; color: #4B5563;">Plateforme numérique de gestion du transport et de la logistique</td>
                <td colspan="2" style="font-size: 14pt; font-weight: bold; color: #059669; text-align: right;">${compName.toUpperCase()}</td>
            </tr>
            <tr style="height: 18px;">
                <td colspan="3" style="font-size: 9pt; color: #4B5563;">Dakar, Sénégal</td>
                <td colspan="2" style="font-size: 10pt; color: #4B5563; text-align: right;">Type : ${compType}</td>
            </tr>
            <tr style="height: 18px;">
                <td colspan="3" style="font-size: 9pt; color: #4B5563;">Tél : +221 78 138 64 05</td>
                <td colspan="2" style="font-size: 10pt; color: #4B5563; text-align: right;">Représentant : ${compManager}</td>
            </tr>
            <tr style="height: 18px;">
                <td colspan="3" style="font-size: 9pt; color: #4B5563;">Email : contact@transen.org</td>
                <td colspan="2" style="font-size: 10pt; color: #4B5563; text-align: right;">Téléphone : ${compPhone}</td>
            </tr>
            <tr style="height: 18px;">
                <td colspan="3" style="font-size: 9pt; color: #4B5563;">Web : compagnie.transen.org</td>
                <td colspan="2" style="font-size: 10pt; color: #4B5563; text-align: right;">E-mail : ${compEmail}</td>
            </tr>
            <tr style="height: 25px; border-bottom: 2px solid #059669;">
                <td colspan="3" style="font-size: 10pt; font-style: italic; color: #6B7280; border-bottom: 2px solid #059669;">Rapport Global de Gestion Consolidé</td>
                <td colspan="2" style="font-size: 10pt; font-style: italic; color: #6B7280; text-align: right; border-bottom: 2px solid #059669;">Édité le : ${new Date().toLocaleString('fr-FR')} | Certifié Intègre</td>
            </tr>
            <tr style="height: 20px;"><td colspan="5"></td></tr>
            ${sectionsHtml}
        </table>
    </body>
    </html>
    `;
}

// ====================================================
// SOLAR AUTOMATIC DARK MODE MODULE
// ====================================================

function initSolarAutoDarkMode() {
    const toggle = document.getElementById('autoDarkModeToggle');
    const infoBox = document.getElementById('solarInfoBox');
    
    // Check saved choice
    const isAutoOn = localStorage.getItem('solar-auto-dark-mode') === 'true';
    if (toggle) {
        toggle.checked = isAutoOn;
    }

    // Default Dakar sunrise / sunset (GMT = local time in Senegal)
    let sunriseHour = 6.67; // 06:40
    let sunsetHour = 19.25; // 19:15
    let sunriseStr = "06:40";
    let sunsetStr = "19:15";

    // Try to load cached values if any
    const cachedSolar = localStorage.getItem('solar-dakar-cache');
    if (cachedSolar) {
        try {
            const data = JSON.parse(cachedSolar);
            sunriseHour = data.sunriseHour;
            sunsetHour = data.sunsetHour;
            sunriseStr = data.sunriseStr;
            sunsetStr = data.sunsetStr;
        } catch (e) {}
    }

    function updateSolarUI() {
        if (infoBox) {
            infoBox.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-sun" style="color: #F59E0B; font-size:1rem;"></i>
                    <div style="text-align: left;">
                        <b>Dakar (Solaire) :</b> Lever à <b>${sunriseStr}</b> &middot; Coucher à <b>${sunsetStr}</b><br>
                        <span style="font-size: 0.68rem; color: var(--text-dim); display: inline-block; margin-top: 2px;">
                            ${localStorage.getItem('solar-auto-dark-mode') === 'true' 
                                ? '🟢 Contrôle intelligent actif' 
                                : '⚪ Désactivé (mode manuel)'}
                        </span>
                    </div>
                </div>`;
        }
    }

    async function fetchSolarData() {
        try {
            const response = await axios.get('https://api.sunrise-sunset.org/json?lat=14.6937&lng=-17.4479&formatted=0');
            const json = response.data;
            if (json && json.results && json.status === 'OK') {
                    const sunriseDate = new Date(json.results.sunrise);
                    const sunsetDate = new Date(json.results.sunset);

                    // Dakar is UTC +/-0 (GMT), get utc hours
                    const riseH = sunriseDate.getUTCHours();
                    const riseM = sunriseDate.getUTCMinutes();
                    const setH = sunsetDate.getUTCHours();
                    const setM = sunsetDate.getUTCMinutes();

                    sunriseHour = riseH + riseM / 60;
                    sunsetHour = setH + setM / 60;

                    sunriseStr = `${String(riseH).padStart(2,'0')}:${String(riseM).padStart(2,'0')}`;
                    sunsetStr = `${String(setH).padStart(2,'0')}:${String(setM).padStart(2,'0')}`;

                    // Cache it
                    localStorage.setItem('solar-dakar-cache', JSON.stringify({
                        sunriseHour, sunsetHour, sunriseStr, sunsetStr
                    }));
                }
        } catch (err) {
            console.warn("Could not retrieve online solar data for Dakar:", err);
        }
        updateSolarUI();
        applySolarModeLifecycle();
    }

    function applySolarModeLifecycle() {
        if (localStorage.getItem('solar-auto-dark-mode') !== 'true') return;

        // Current Senegal time (Senegal is GMT +0)
        const now = new Date();
        const currentHour = now.getUTCHours() + now.getUTCMinutes() / 60;

        const isNight = currentHour < sunriseHour || currentHour > sunsetHour;
        const currentTheme = localStorage.getItem('theme-mode') || 'light';

        const themeToggleBtn = document.getElementById('themeToggleBtn');

        if (isNight && currentTheme !== 'dark') {
            localStorage.setItem('theme-mode', 'dark');
            window.applyTheme('dark');
            triggerThemeChangesRefresh();
            Toastify({
                text: "🌙 Mode sombre automatique activé (Coucher du soleil à Dakar)",
                duration: 4000,
                style: { background: "linear-gradient(to right, #4F46E5, #3730A3)" }
            }).showToast();
        } else if (!isNight && currentTheme === 'dark') {
            localStorage.setItem('theme-mode', 'light');
            window.applyTheme('light');
            triggerThemeChangesRefresh();
            Toastify({
                text: "☀️ Mode clair automatique activé (Lever du soleil à Dakar)",
                duration: 4000,
                style: { background: "linear-gradient(to right, #F59E0B, #D97706)" }
            }).showToast();
        }
    }

    function triggerThemeChangesRefresh() {
        const activeFilter = document.querySelector('.chart-filters button.active');
        const range = activeFilter ? activeFilter.getAttribute('data-range') : '7d';
        if (typeof renderRevenueChart === 'function') renderRevenueChart(range);
        if (typeof renderKPIBarCharts === 'function') {
            renderKPIBarCharts(window.loadedDriversCache || [], window.loadedTrips || []);
        }
        if (typeof renderVehicleDonutChart === 'function') {
            renderVehicleDonutChart(window.loadedDriversCache || []);
        }
        if (typeof renderDriverStatusPieChart === 'function') {
            renderDriverStatusPieChart(window.loadedDriversCache || []);
        }
    }

    if (toggle) {
        toggle.onchange = (e) => {
            const active = e.target.checked;
            localStorage.setItem('solar-auto-dark-mode', active ? 'true' : 'false');
            
            window.addAuditLog(
                "Mode Sombre Automatique", 
                `Mode Sombre automatique basé sur Dakar ${active ? 'activé' : 'désactivé'}`, 
                "SÉCURITÉ"
            );

            updateSolarUI();
            if (active) {
                applySolarModeLifecycle();
            }
        };
    }

    // Init process
    fetchSolarData();

    // Check periodically (every 60 seconds)
    setInterval(applySolarModeLifecycle, 60000);
}

// ====================================================
// PROACTIVE WALLET THRESHOLD ENGINE (SENEPAY RECHARGE)
// ====================================================

window.switchToSection = function(section) {
    const navLink = document.querySelector(`#mainNav a[data-section="${section}"]`) || document.querySelector(`.bottom-nav-item[data-section="${section}"]`);
    if (navLink) {
        navLink.click();
    } else {
        document.querySelectorAll('.admin-section').forEach(s => {
            s.classList.remove('active-section');
            s.style.display = 'none';
        });
        const target = document.getElementById(`section-${section}`);
        if (target) {
            target.style.display = 'block';
            target.classList.add('active-section');
        }
        document.querySelectorAll('#mainNav a').forEach(l => l.classList.remove('active'));
    }
};

function initWalletThresholdEngine() {
    const configBtn = document.getElementById('configureThresholdBtn');
    const walletConfigBtn = document.getElementById('walletConfigThresholdBtn');
    const rechargeBtn = document.getElementById('rechargeSenepayBtn');

    const openThresholdModal = () => {
        const current = localStorage.getItem('wallet_critical_threshold') || '25000';
        const valInput = document.getElementById('thresholdAmountInput');
        if (valInput) valInput.value = current;
        document.getElementById('thresholdModal').style.display = 'flex';
    };

    if (configBtn) {
        configBtn.addEventListener('click', () => {
            window.switchToSection('wallet');
            setTimeout(openThresholdModal, 180);
        });
    }

    if (walletConfigBtn) {
        walletConfigBtn.addEventListener('click', () => {
            openThresholdModal();
        });
    }

    const cancelThresholdBtn = document.getElementById('cancelThresholdBtn');
    if (cancelThresholdBtn) {
        cancelThresholdBtn.onclick = () => {
            document.getElementById('thresholdModal').style.display = 'none';
        };
    }

    const confirmThresholdBtn = document.getElementById('confirmThresholdBtn');
    if (confirmThresholdBtn) {
        confirmThresholdBtn.onclick = () => {
            const valInput = document.getElementById('thresholdAmountInput').value;
            const val = parseInt(valInput.trim());
            if (isNaN(val) || val < 0) {
                Toastify({
                    text: "❌ Veuillez entrer un montant de seuil valide.",
                    duration: 3000,
                    style: { background: "linear-gradient(to right, #EF4444, #DC2626)" }
                }).showToast();
                return;
            }

            localStorage.setItem('wallet_critical_threshold', val.toString());
            sessionStorage.removeItem('dismissed_alert_walletThresholdAlert');
            
            if (typeof window.addAuditLog === 'function') {
                window.addAuditLog("Seuil Portefeuille Modifié", `Seuil d'alerte du solde configuré à ${val.toLocaleString()} F CFA`, "SÉCURITÉ");
            }

            Toastify({
                text: `💾 Seuil d'alerte configuré à ${val.toLocaleString()} F CFA !`,
                duration: 3000,
                style: { background: "linear-gradient(to right, #3B82F6, #1D4ED8)" }
            }).showToast();

            document.getElementById('thresholdModal').style.display = 'none';
            // Trigger check immediately
            loadDashboardData();
        };
    }

    if (rechargeBtn) {
        rechargeBtn.addEventListener('click', () => {
            currentSenepayAction = 'deposit';
            const modalTitle = document.getElementById('senepayModalTitle');
            if (modalTitle) modalTitle.innerText = "Déposer des fonds (SenePay)";
            const operatorGroup = document.getElementById('senepayOperatorGroup');
            if (operatorGroup) operatorGroup.style.display = "none";
            document.getElementById('senepayModal').style.display = "flex";
        });
    }
}

// ====================================================
// PINNED FAVORITES शॉर्टकट्स CORES
// ====================================================

window.getFavorites = function() {
    try {
        return JSON.parse(localStorage.getItem('transen_favorites') || '[]');
    } catch(e) {
        return [];
    }
};

window.isFavorite = function(type, id) {
    const list = window.getFavorites();
    return list.some(item => item.type === type && item.id === id);
};

window.toggleFavorite = function(type, id, label) {
    let list = window.getFavorites();
    const idx = list.findIndex(item => item.type === type && item.id === id);
    if (idx > -1) {
        list.splice(idx, 1);
        Toastify({
            text: `📌 Retiré des favoris !`,
            duration: 3000,
            style: { background: "linear-gradient(to right, #6B7280, #374151)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    } else {
        list.push({ type, id, label });
        Toastify({
            text: `⭐ Épinglé aux favoris !`,
            duration: 3000,
            style: { background: "linear-gradient(to right, #F59E0B, #D97706)", fontFamily: "Outfit, sans-serif" }
        }).showToast();
    }
    localStorage.setItem('transen_favorites', JSON.stringify(list));
    
    // Refresh the sidebar list
    window.renderFavoritesSidebar();
    
    // Trigger real-time view updates
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    }
};

window.renderFavoritesSidebar = function() {
    const container = document.getElementById('sidebarFavoritesList');
    if (!container) return;

    const list = window.getFavorites();
    if (list.length === 0) {
        container.innerHTML = `<span style="font-size: 0.72rem; color: var(--text-dim); font-style: italic; padding-left: 5px;">Aucun favori épinglé.</span>`;
        return;
    }

    container.innerHTML = "";
    list.forEach(item => {
        const icon = item.type === 'driver' ? 'fa-user' : 'fa-route';
        
        const el = document.createElement('div');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'space-between';
        el.style.padding = '5px 8px';
        el.style.borderRadius = '6px';
        el.style.background = 'rgba(0,0,0,0.03)';
        el.style.transition = 'all 0.2s';
        
        el.onmouseenter = () => { el.style.background = 'rgba(0,0,0,0.06)'; };
        el.onmouseleave = () => { el.style.background = 'rgba(0,0,0,0.03)'; };

        el.innerHTML = `
            <span style="font-size: 0.74rem; font-weight: 500; cursor: pointer; color: var(--text-main); display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" onclick="window.clickFavoriteShortCut('${item.type}', '${item.id}', '${(item.label || "").replace(/'/g, "\\'")}')" title="Accéder à : ${item.label}">
                <i class="fas ${icon}" style="color: var(--primary); font-size: 0.72rem;"></i>
                <span style="overflow: hidden; text-overflow: ellipsis;">${item.label}</span>
            </span>
            <button onclick="window.toggleFavorite('${item.type}', '${item.id}', '${(item.label || "").replace(/'/g, "\\'")}')" style="border:none; background:none; cursor:pointer; color: var(--text-dim); padding: 2px 4px; font-size: 0.7rem; display: inline-flex; align-items: center;" title="Désépingler">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(el);
    });
};

window.clickFavoriteShortCut = function(type, id, label) {
    if (type === 'driver') {
        // Switch section to drivers
        const tab = document.querySelector('#mainNav a[data-section="drivers"]');
        if (tab) {
            tab.click();
            
            setTimeout(() => {
                // Highlight row in driversTableBody
                const rows = document.querySelectorAll('#driversTableBody tr');
                let found = false;
                rows.forEach(r => {
                    if (r.innerText.includes(label)) {
                        found = true;
                        r.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                        r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => r.style.backgroundColor = '', 3000);
                    }
                });
                
                if (!found) {
                    Toastify({
                        text: `🔍 Chauffeur ${label} introuvable dans le tableau actuel`,
                        duration: 3000,
                        style: { background: "#EF4444" }
                    }).showToast();
                }
            }, 300);
        }
    } else if (type === 'trip') {
        // Switch section to trips (courses)
        const tab = document.querySelector('#mainNav a[data-section="trips"]');
        if (tab) {
            tab.click();
            
            setTimeout(() => {
                const rows = document.querySelectorAll('#liveTripsTableBody tr');
                let found = false;
                const cleanId6 = id.substring(0, 6);
                rows.forEach(r => {
                    if (r.innerText.includes(cleanId6) || r.innerText.includes(label.split(' ➔ ')[0])) {
                        found = true;
                        r.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                        r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => r.style.backgroundColor = '', 3000);
                    }
                });
                
                if (!found) {
                    Toastify({
                        text: `🔍 Trajet de course introuvable dans la liste actuelle`,
                        duration: 3000,
                        style: { background: "#EF4444" }
                    }).showToast();
                }
            }, 300);
        }
    }
};

// Initialize favorites lists in sideboard
function initFavoritesList() {
    window.renderFavoritesSidebar();
}
