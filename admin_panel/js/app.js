import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

// Helper for REST calls to Spring Boot backend
async function adminFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    const response = await fetch(`https://api.transen.org${url}`, {
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
        const res = await fetch('https://api.transen.org/api/auth/admin/login', {
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
    initDashboard();
}

function hideApp() {
    document.getElementById('login-overlay').style.display = "flex";
    document.getElementById('admin-app').style.display = "none";
}

function initDashboard() {
    setupNavigation();
    syncGlobalStats();
    syncRecentActivity();
    syncLiveFeed();
    syncDrivers();
    syncCompanies();
    syncUsers();
    syncAdmins();
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
        };
    });
}

async function syncGlobalStats() {
    console.log("Syncing Global Stats from REST API...");
    try {
        const res = await adminFetch('/api/admin/stats');
        if (!res.ok) throw new Error("Impossible de charger les statistiques.");
        const stats = await res.json();
        
        document.getElementById('totalTrips').innerText = stats.totalTrips || 0;
        document.getElementById('totalUsers').innerText = stats.totalUsers || 0;
        document.getElementById('totalRevenue').innerText = (stats.totalRevenue || 0).toLocaleString() + " F";
        document.getElementById('estCommissions').innerText = (stats.estCommissions || 0).toLocaleString() + " F";
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

function syncDrivers() {
    onSnapshot(query(collection(db, "users"), where("role", "==", "driver")), 
        snap => {
            const tbody = document.getElementById('driversTableBody');
            tbody.innerHTML = "";
            snap.forEach(docSnap => {
                const d = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><b>${d.name}</b><br><small>${d.phone}</small></td>
                    <td>${d.vehicleModel || 'N/A'}<br><small>${d.vehiclePlate || ''}</small></td>
                    <td>⭐ ${d.rating || '5.0'}</td>
                    <td>${d.walletBalance || 0} F</td>
                    <td><span class="status-tag ${d.isVerified ? 'completed' : 'pending'}">${d.isVerified ? 'OUI' : 'NON'}</span></td>
                    <td><span class="status-tag ${d.status}">${d.status?.toUpperCase() || 'INACTIF'}</span></td>
                    <td>
                        <button class="icon-btn glass" onclick="window.openDoc('${docSnap.id}', '${d.licenseImageUrl}')"><i class="fas fa-eye"></i></button>
                        <button class="icon-btn glass" onclick="window.toggleDriver('${docSnap.id}', '${d.status}')"><i class="fas fa-power-off"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        },
        e => handleError(e, "Drivers Sync")
    );
}

async function syncCompanies() {
    console.log("Syncing Companies from REST API...");
    try {
        const res = await adminFetch('/api/admin/companies');
        if (!res.ok) throw new Error("Impossible de charger les compagnies.");
        const companies = await res.json();
        
        const tbody = document.getElementById('companiesTableBody');
        tbody.innerHTML = "";
        
        let pendingCount = 0;
        
        companies.forEach(c => {
            if (c.status === 'PENDING') pendingCount++;
            
            const tr = document.createElement('tr');
            
            let docsHtml = '';
            if (c.rccmUrl || c.nineaUrl || c.managerFrontUrl || c.managerBackUrl || c.transportAuthUrl) {
                docsHtml = `<button class="btn-text" style="color:var(--primary); border:none; background:none; cursor:pointer; font-weight:bold; font-family:inherit;" onclick="window.openCompanyKyc('${c.id}')"><i class="fas fa-file-invoice"></i> Examiner Dossier</button>`;
            } else {
                docsHtml = `<span style="color:gray; font-size:0.85rem;">Aucun document</span>`;
            }
            
            let statusClass = 'pending';
            if (c.status === 'APPROVED') statusClass = 'completed';
            if (c.status === 'REJECTED') statusClass = 'failed';
            
            const statusTag = `<span class="status-tag ${statusClass}">${c.status}</span>`;
            
            let actionsHtml = '';
            if (c.status === 'PENDING') {
                actionsHtml = `<button class="icon-btn glass" style="color:var(--primary);" onclick="window.openCompanyKyc('${c.id}')"><i class="fas fa-check-double"></i></button>`;
            } else {
                actionsHtml = `<button class="icon-btn glass" style="color:var(--text-dim);" onclick="window.openCompanyKyc('${c.id}')"><i class="fas fa-eye"></i></button>`;
            }
            
            tr.innerHTML = `
                <td><b>${c.name}</b></td>
                <td><span class="badge blue">${c.type}</span></td>
                <td>
                    <b>${c.managerName || 'Non lié'}</b><br>
                    <small>${c.managerPhone || ''}</small>
                </td>
                <td><code style="background:rgba(255,255,255,0.05); padding:3px 6px; border-radius:5px;">${c.accessCode}</code></td>
                <td>${docsHtml}</td>
                <td>${statusTag}</td>
                <td>${actionsHtml}</td>
            `;
            tbody.appendChild(tr);
        });
        
        const badge = document.getElementById('pendingCompBadge');
        if (badge) {
            badge.innerText = pendingCount;
            badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
        
    } catch (e) {
        console.error("Error fetching companies:", e);
    }
}

function syncUsers() {
    onSnapshot(query(collection(db, "users"), where("role", "==", "client"), limit(100)), 
        snap => {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = "";
            snap.forEach(docSnap => {
                const u = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><b>${u.name}</b></td>
                    <td>${u.phone}</td>
                    <td>${u.email || '--'}</td>
                    <td>${u.referralCount || 0}</td>
                    <td>${u.bonusPoints || 0} pts</td>
                    <td><button class="icon-btn glass"><i class="fas fa-history"></i></button></td>
                `;
                tbody.appendChild(tr);
            });
        },
        e => handleError(e, "Users Sync")
    );
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
    document.getElementById('approveDocBtn').onclick = () => updateDoc(doc(db, "users", userId), { isVerified: true }).then(() => modal.style.display="none");
    document.getElementById('rejectDocBtn').onclick = () => updateDoc(doc(db, "users", userId), { isVerified: false, status: 'rejected' }).then(() => modal.style.display="none");
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
        
        const setupDocLink = (elemId, url) => {
            const elem = document.getElementById(elemId);
            if (url) {
                elem.style.display = 'block';
                elem.onclick = (e) => {
                    e.preventDefault();
                    previewImg.src = url;
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
                        alert("Compagnie approuvée et activée avec succès !");
                        modal.style.display = "none";
                        syncCompanies();
                    } else {
                        const errMsg = await actionRes.text();
                        alert("Erreur: " + errMsg);
                    }
                }
            );
        };
        
        document.getElementById('rejectCompanyBtn').onclick = () => {
            const reason = document.getElementById('companyRejectionReason').value.trim();
            if (!reason) {
                alert("La raison du rejet est obligatoire pour refuser un dossier.");
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
                        alert("Dossier rejeté.");
                        modal.style.display = "none";
                        syncCompanies();
                    } else {
                        const errMsg = await actionRes.text();
                        alert("Erreur: " + errMsg);
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

// Custom Slide-in Confirmation Drawer Helper
window.showConfirmDrawer = function(title, message, isDangerous, onConfirm) {
    const drawer = document.getElementById('confirmDrawer');
    const icon = document.getElementById('confirmIcon');
    const yesBtn = document.getElementById('confirmYesBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = message;
    
    if (isDangerous) {
        icon.className = 'confirm-icon';
        icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        yesBtn.className = 'confirm-btn-yes';
        yesBtn.innerText = 'Confirmer';
    } else {
        icon.className = 'confirm-icon success-icon';
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        yesBtn.className = 'confirm-btn-yes primary-btn';
        yesBtn.innerText = 'Approuver';
    }
    
    // Show drawer
    drawer.classList.add('show');
    
    // Set callbacks
    yesBtn.onclick = () => {
        drawer.classList.remove('show');
        onConfirm();
    };
    
    cancelBtn.onclick = () => {
        drawer.classList.remove('show');
    };
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
