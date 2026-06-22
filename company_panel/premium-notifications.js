/**
 * TranSen Premium Notifications & Confirmations Drawer System
 * Centralized script to handle premium slide-in drawers and overrides browser alerts.
 */

(function() {
    // 1. Inject Premium Styles
    const css = `
        /* Slide-in Confirmation/Notification Drawer */
        .confirm-drawer {
            position: fixed;
            top: -180px; /* Hidden above screen */
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 500px;
            padding: 22px 25px;
            border-radius: 24px;
            z-index: 999999; /* Set extremely high to override modals/overlays */
            background: #FFFFFF !important; /* Premium light emerald theme white */
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            box-shadow: 0 20px 50px rgba(6, 78, 59, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.1) !important;
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
            opacity: 0;
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            color: #0F172A !important;
        }

        .confirm-drawer.show {
            top: 30px !important; /* Slides down */
            opacity: 1 !important;
        }

        .confirm-drawer-content {
            display: flex !important;
            align-items: center !important;
            gap: 20px !important;
            width: 100% !important;
        }

        .confirm-icon {
            width: 48px !important;
            height: 48px !important;
            border-radius: 14px !important;
            background: rgba(239, 68, 68, 0.12) !important;
            color: #ef4444 !important; /* Red */
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 1.3rem !important;
            flex-shrink: 0 !important;
        }

        .confirm-icon.success-icon {
            background: rgba(16, 185, 129, 0.12) !important;
            color: #10b981 !important; /* Green */
        }

        .confirm-text {
            flex: 1 !important;
            min-width: 0 !important;
        }

        .confirm-text h4 {
            font-size: 1.1rem !important;
            font-weight: 700 !important;
            color: #0F172A !important;
            margin: 0 0 4px 0 !important;
            line-height: 1.2 !important;
        }

        .confirm-text p {
            font-size: 0.88rem !important;
            color: #475569 !important; /* Dim slate */
            margin: 0 !important;
            line-height: 1.4 !important;
            word-wrap: break-word !important;
        }

        .confirm-actions {
            display: flex !important;
            gap: 12px !important;
            margin-left: auto !important;
        }

        .confirm-btn-cancel {
            padding: 10px 18px !important;
            background: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            color: #475569 !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }

        .confirm-btn-cancel:hover {
            background: #e2e8f0 !important;
            color: #0f172a !important;
        }

        .confirm-btn-yes {
            padding: 10px 18px !important;
            background: #ef4444 !important;
            border: none !important;
            border-radius: 12px !important;
            color: white !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25) !important;
        }

        .confirm-btn-yes.primary-btn {
            background: #10b981 !important;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25) !important;
        }

        .confirm-btn-yes:hover {
            transform: translateY(-1px) !important;
            opacity: 0.95 !important;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    // 2. Inject HTML Elements dynamically on DOMContentLoaded/load
    function injectHTML() {
        // Notification Drawer
        if (!document.getElementById('notificationDrawer')) {
            const notifDrawer = document.createElement('div');
            notifDrawer.id = 'notificationDrawer';
            notifDrawer.className = 'confirm-drawer glass';
            notifDrawer.innerHTML = `
                <div class="confirm-drawer-content">
                    <div id="notificationIcon" class="confirm-icon"><i class="fas fa-info-circle"></i></div>
                    <div class="confirm-text">
                        <h4 id="notificationTitle">Notification</h4>
                        <p id="notificationMessage">Message...</p>
                    </div>
                    <div class="confirm-actions">
                        <button id="notificationOkBtn" class="confirm-btn-yes primary-btn" style="padding: 10px 30px; border-radius: 12px; min-width: 100px;">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(notifDrawer);
        }

        // Confirmation Drawer
        if (!document.getElementById('confirmDrawer')) {
            const confDrawer = document.createElement('div');
            confDrawer.id = 'confirmDrawer';
            confDrawer.className = 'confirm-drawer glass';
            confDrawer.innerHTML = `
                <div class="confirm-drawer-content">
                    <div id="confirmIcon" class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="confirm-text">
                        <h4 id="confirmTitle">Confirmation</h4>
                        <p id="confirmMessage">Voulez-vous continuer ?</p>
                    </div>
                    <div class="confirm-actions">
                        <button id="confirmCancelBtn" class="confirm-btn-cancel">Annuler</button>
                        <button id="confirmYesBtn" class="confirm-btn-yes">Confirmer</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confDrawer);
        }
    }

    if (document.body) {
        injectHTML();
    } else {
        document.addEventListener('DOMContentLoaded', injectHTML);
    }

    // 3. Define Global Helpers on window
    window.showNotificationDrawer = function(title, message, isError = false) {
        const drawer = document.getElementById('notificationDrawer');
        if (!drawer) return;

        const icon = document.getElementById('notificationIcon');
        const okBtn = document.getElementById('notificationOkBtn');
        const titleEl = document.getElementById('notificationTitle');
        const msgEl = document.getElementById('notificationMessage');

        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;

        if (isError) {
            if (icon) {
                icon.className = 'confirm-icon';
                icon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
            }
            if (okBtn) {
                okBtn.className = 'confirm-btn-yes';
                okBtn.style.background = '#ef4444';
            }
        } else {
            if (icon) {
                icon.className = 'confirm-icon success-icon';
                icon.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
            }
            if (okBtn) {
                okBtn.className = 'confirm-btn-yes primary-btn';
                okBtn.style.background = '#10b981';
            }
        }

        // Close confirmation drawer if visible to avoid overlapping
        const confirmDrawer = document.getElementById('confirmDrawer');
        if (confirmDrawer) confirmDrawer.classList.remove('show');

        drawer.classList.add('show');

        if (okBtn) {
            okBtn.onclick = function() {
                drawer.classList.remove('show');
            };
        }
    };

    window.showConfirmDrawer = function(title, message, isDangerous, onConfirm) {
        const drawer = document.getElementById('confirmDrawer');
        if (!drawer) return;

        const icon = document.getElementById('confirmIcon');
        const yesBtn = document.getElementById('confirmYesBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');

        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;

        if (isDangerous) {
            if (icon) {
                icon.className = 'confirm-icon';
                icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            }
            if (yesBtn) {
                yesBtn.className = 'confirm-btn-yes';
                yesBtn.innerText = 'Confirmer';
                yesBtn.style.background = '#ef4444';
            }
        } else {
            if (icon) {
                icon.className = 'confirm-icon success-icon';
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            }
            if (yesBtn) {
                yesBtn.className = 'confirm-btn-yes primary-btn';
                yesBtn.innerText = 'Approuver';
                yesBtn.style.background = '#10b981';
            }
        }

        // Close notification drawer if visible to avoid overlapping
        const notifDrawer = document.getElementById('notificationDrawer');
        if (notifDrawer) notifDrawer.classList.remove('show');

        drawer.classList.add('show');

        yesBtn.onclick = function() {
            drawer.classList.remove('show');
            if (typeof onConfirm === 'function') onConfirm();
        };

        cancelBtn.onclick = function() {
            drawer.classList.remove('show');
        };
    };

    // Global Toast helper
    window.showToast = function(message, type = "success") {
        const isError = type === "error" || type === "danger";
        window.showNotificationDrawer(isError ? "Erreur" : "Succès", message, isError);
    };

    // 4. Override window.alert
    const originalAlert = window.alert;
    window.alert = function(message) {
        console.log("Alert intercepted:", message);
        if (message === undefined || message === null) return;
        const isError = /erreur|error|fail|impossible|refus|invalide|incorrect|dépasse|dépassé|aucun/i.test(String(message));
        const title = isError ? "Erreur" : "Notification";
        window.showNotificationDrawer(title, String(message), isError);
    };
})();
