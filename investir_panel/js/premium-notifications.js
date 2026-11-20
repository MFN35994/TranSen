/**
 * TranSen Invest Aurora — Premium Notifications & Confirmations Drawer System
 * Responsive emerald-obsidian glassmorphism drawers replacing native browser alerts.
 */
(function () {
    const css = `
        .confirm-drawer {
            position: fixed;
            top: -220px;
            left: 50%;
            transform: translateX(-50%);
            width: min(94vw, 520px);
            padding: 18px 20px;
            border-radius: 20px;
            z-index: 999999;
            background: linear-gradient(155deg, rgba(10, 34, 25, 0.96), rgba(3, 16, 11, 0.98)) !important;
            backdrop-filter: blur(20px) saturate(150%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(150%) !important;
            border: 1px solid rgba(245, 184, 61, 0.34) !important;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.72), 0 0 30px rgba(16, 185, 129, 0.16) !important;
            transition: top 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease !important;
            opacity: 0;
            pointer-events: none;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            color: #F0FDF7 !important;
        }

        .confirm-drawer.show {
            top: 20px !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        .confirm-drawer-content {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
            width: 100% !important;
            flex-wrap: wrap !important;
        }

        .confirm-icon {
            width: 44px !important;
            height: 44px !important;
            border-radius: 14px !important;
            background: rgba(239, 68, 68, 0.14) !important;
            border: 1px solid rgba(239, 68, 68, 0.32) !important;
            color: #F87171 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 1.2rem !important;
            flex-shrink: 0 !important;
        }

        .confirm-icon.success-icon {
            background: rgba(16, 185, 129, 0.15) !important;
            border-color: rgba(52, 211, 153, 0.35) !important;
            color: #34D399 !important;
        }

        .confirm-text {
            flex: 1 1 200px !important;
            min-width: 0 !important;
        }

        .confirm-text h4 {
            font-family: 'Sora', 'Inter', sans-serif !important;
            font-size: 0.98rem !important;
            font-weight: 700 !important;
            color: #F0FDF7 !important;
            margin: 0 0 4px 0 !important;
            line-height: 1.25 !important;
        }

        .confirm-text p {
            font-size: 0.85rem !important;
            color: #94A3B8 !important;
            margin: 0 !important;
            line-height: 1.45 !important;
            word-wrap: break-word !important;
        }

        .confirm-actions {
            display: flex !important;
            gap: 10px !important;
            margin-left: auto !important;
            flex-shrink: 0 !important;
        }

        .confirm-btn-cancel {
            padding: 9px 16px !important;
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            border-radius: 999px !important;
            color: #CBD5E1 !important;
            font-size: 0.82rem !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
        }

        .confirm-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #FFFFFF !important;
        }

        .confirm-btn-yes {
            padding: 9px 20px !important;
            background: linear-gradient(135deg, #EF4444, #DC2626) !important;
            border: none !important;
            border-radius: 999px !important;
            color: #FFFFFF !important;
            font-size: 0.82rem !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 6px 18px rgba(239, 68, 68, 0.28) !important;
        }

        .confirm-btn-yes.primary-btn {
            background: linear-gradient(135deg, #FDE68A, #F5B83D) !important;
            color: #161002 !important;
            box-shadow: 0 6px 18px rgba(245, 184, 61, 0.35) !important;
        }

        .confirm-btn-yes:hover {
            transform: translateY(-1px) !important;
            filter: brightness(1.06) !important;
        }

        @media (max-width: 480px) {
            .confirm-drawer { padding: 14px 16px; border-radius: 16px; }
            .confirm-actions { width: 100%; justify-content: flex-end; }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    let autoCloseTimer = null;

    function injectHTML() {
        if (!document.getElementById('notificationDrawer')) {
            const notifDrawer = document.createElement('div');
            notifDrawer.id = 'notificationDrawer';
            notifDrawer.className = 'confirm-drawer';
            notifDrawer.setAttribute('role', 'status');
            notifDrawer.setAttribute('aria-live', 'polite');
            notifDrawer.innerHTML = `
                <div class="confirm-drawer-content">
                    <div id="notificationIcon" class="confirm-icon"><i class="fas fa-info-circle"></i></div>
                    <div class="confirm-text">
                        <h4 id="notificationTitle">Notification</h4>
                        <p id="notificationMessage"></p>
                    </div>
                    <div class="confirm-actions">
                        <button id="notificationOkBtn" type="button" class="confirm-btn-yes primary-btn">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(notifDrawer);
        }

        if (!document.getElementById('confirmDrawer')) {
            const confDrawer = document.createElement('div');
            confDrawer.id = 'confirmDrawer';
            confDrawer.className = 'confirm-drawer';
            confDrawer.setAttribute('role', 'alertdialog');
            confDrawer.innerHTML = `
                <div class="confirm-drawer-content">
                    <div id="confirmIcon" class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="confirm-text">
                        <h4 id="confirmTitle">Confirmation</h4>
                        <p id="confirmMessage">Voulez-vous continuer ?</p>
                    </div>
                    <div class="confirm-actions">
                        <button id="confirmCancelBtn" type="button" class="confirm-btn-cancel">Annuler</button>
                        <button id="confirmYesBtn" type="button" class="confirm-btn-yes">Confirmer</button>
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const n = document.getElementById('notificationDrawer');
            const c = document.getElementById('confirmDrawer');
            if (n) n.classList.remove('show');
            if (c) c.classList.remove('show');
        }
    });

    window.showNotificationDrawer = function (title, message, isError = false) {
        if (!document.getElementById('notificationDrawer')) injectHTML();
        const drawer = document.getElementById('notificationDrawer');
        if (!drawer) return;

        const icon = document.getElementById('notificationIcon');
        const okBtn = document.getElementById('notificationOkBtn');
        const titleEl = document.getElementById('notificationTitle');
        const msgEl = document.getElementById('notificationMessage');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        if (isError) {
            if (icon) {
                icon.className = 'confirm-icon';
                icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            }
            if (okBtn) okBtn.className = 'confirm-btn-yes';
        } else {
            if (icon) {
                icon.className = 'confirm-icon success-icon';
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            }
            if (okBtn) okBtn.className = 'confirm-btn-yes primary-btn';
        }

        const confirmDrawer = document.getElementById('confirmDrawer');
        if (confirmDrawer) confirmDrawer.classList.remove('show');

        drawer.classList.add('show');
        clearTimeout(autoCloseTimer);
        if (!isError) {
            autoCloseTimer = setTimeout(() => drawer.classList.remove('show'), 6500);
        }

        if (okBtn) {
            okBtn.onclick = function () {
                clearTimeout(autoCloseTimer);
                drawer.classList.remove('show');
            };
        }
    };

    window.showConfirmDrawer = function (title, message, isDangerous, onConfirm) {
        if (!document.getElementById('confirmDrawer')) injectHTML();
        const drawer = document.getElementById('confirmDrawer');
        if (!drawer) return;

        const icon = document.getElementById('confirmIcon');
        const yesBtn = document.getElementById('confirmYesBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        if (isDangerous) {
            if (icon) {
                icon.className = 'confirm-icon';
                icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            }
            if (yesBtn) {
                yesBtn.className = 'confirm-btn-yes';
                yesBtn.textContent = 'Confirmer';
            }
        } else {
            if (icon) {
                icon.className = 'confirm-icon success-icon';
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            }
            if (yesBtn) {
                yesBtn.className = 'confirm-btn-yes primary-btn';
                yesBtn.textContent = 'Valider';
            }
        }

        const notifDrawer = document.getElementById('notificationDrawer');
        if (notifDrawer) notifDrawer.classList.remove('show');

        drawer.classList.add('show');

        yesBtn.onclick = function () {
            drawer.classList.remove('show');
            if (typeof onConfirm === 'function') onConfirm();
        };

        cancelBtn.onclick = function () {
            drawer.classList.remove('show');
        };
    };

    window.showToast = function (message, type = 'success') {
        const isError = type === 'error' || type === 'danger';
        window.showNotificationDrawer(isError ? 'Erreur' : 'Succès', message, isError);
    };

    window.alert = function (message) {
        if (message === undefined || message === null) return;
        const isError = /erreur|error|fail|impossible|refus|invalide|incorrect|dépasse|dépassé|aucun/i.test(String(message));
        window.showNotificationDrawer(isError ? 'Erreur' : 'Notification', String(message), isError);
    };
})();
