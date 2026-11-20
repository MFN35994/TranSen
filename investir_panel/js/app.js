/**
 * TranSen Invest Aurora — Main Investor Portal Controller
 * Handles live Phase 1 fundraising stats, interactive financial scenarios,
 * ROI/TRI simulator, Community KYC subscription, Institutional Data Room lead capture,
 * portfolio login, and Super-Admin telemetry / emergency broadcast receiver.
 */
document.addEventListener('DOMContentLoaded', () => {
    const api = window.TransenInvestApi;
    const API_HOST = api
        ? api.API_HOST
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8081'
            : 'https://api.transen.org');

    const requestFn = (url, opts) => (api ? api.fetchWithSafety(url, opts) : fetch(`${API_HOST}${url}`, opts));

    const ACTION_PRICE = 500;
    const PHASE1_TARGET = 217797000;
    const ALLOWED_KYC_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

    // Financial scenarios from Business Plan TranSen (Septembre 2026 — 217,8 M FCFA / 22,5 % capital)
    const SCENARIOS = {
        conservateur: {
            arrY3: '521,0 M F',
            arrMult: '1,8× ARR Mois 18',
            exitMult: '3,0× ARR',
            valuation: 'Valo : 1,56 Md FCFA',
            roi: '1,61×',
            roiNote: 'Hypothèse prudente',
            tri: '17,3 %',
            triNote: 'Rendement annualisé 3 ans',
            van: '-57,7 M F',
            vanNote: 'Sous taux plancher 30 %',
            vanClass: 'text-rose'
        },
        central: {
            arrY3: '723,6 M F',
            arrMult: '2,5× ARR Mois 18',
            exitMult: '4,0× ARR',
            valuation: 'Valo : 2,89 Md FCFA',
            roi: '2,99×',
            roiNote: '~3,0× la mise initiale',
            tri: '44,1 %',
            triNote: 'Rendement annualisé 3 ans',
            van: '+78,6 M F',
            vanNote: 'Création de valeur nette',
            vanClass: 'text-emerald'
        },
        optimiste: {
            arrY3: '1 013,0 M F',
            arrMult: '3,5× ARR Mois 18',
            exitMult: '6,0× ARR',
            valuation: 'Valo : 6,08 Md FCFA',
            roi: '6,28×',
            roiNote: 'Croissance accélérée',
            tri: '84,5 %',
            triNote: 'Rendement annualisé 3 ans',
            van: '+404,7 M F',
            vanNote: 'Forte création de valeur',
            vanClass: 'text-emerald'
        }
    };

    // =========================================================================
    // 1. Mobile Navigation Drawer & FAQ Accordion
    // =========================================================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    if (mobileMenuBtn && mobileNavDrawer) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavDrawer.classList.toggle('open');
        });
        mobileNavDrawer.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => mobileNavDrawer.classList.remove('open'));
        });
    }

    document.querySelectorAll('.faq-question').forEach((btn) => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            if (item) item.classList.toggle('open');
        });
    });

    // =========================================================================
    // 2. Live Phase 1 Fundraising Stats & API Health Pill
    // =========================================================================
    const apiHealthPill = document.getElementById('apiHealthPill');
    const apiHealthText = document.getElementById('apiHealthText');
    const liveAmountPledged = document.getElementById('liveAmountPledged');
    const liveProgressPct = document.getElementById('liveProgressPct');
    const liveProgressBar = document.getElementById('liveProgressBar');
    const liveInvestorsCount = document.getElementById('liveInvestorsCount');
    const liveSharesPledged = document.getElementById('liveSharesPledged');

    async function loadPublicFundraisingStats() {
        try {
            const res = await requestFn('/api/investments/public-stats', { bypassCache: true, timeoutMs: 8000 });
            if (!res.ok) throw new Error('Stats indisponibles');
            const stats = await res.json();

            const pledged = Number(stats.totalAmountPledged || 0);
            const target = Number(stats.phase1TargetFcfa || PHASE1_TARGET);
            const pct = target > 0 ? Math.min(100, (pledged / target) * 100) : 0;

            if (liveAmountPledged) liveAmountPledged.textContent = `${pledged.toLocaleString('fr-FR')} FCFA`;
            if (liveProgressPct) liveProgressPct.textContent = `${pct < 1 && pledged > 0 ? pct.toFixed(2) : pct.toFixed(1)} %`;
            if (liveProgressBar) liveProgressBar.style.width = `${Math.max(pct, pledged > 0 ? 3 : 2)}%`;
            if (liveInvestorsCount) liveInvestorsCount.textContent = Number(stats.totalInvestors || 0).toLocaleString('fr-FR');
            if (liveSharesPledged) liveSharesPledged.textContent = Number(stats.totalSharesPledged || 0).toLocaleString('fr-FR');

            if (apiHealthPill) apiHealthPill.classList.remove('offline');
            if (apiHealthText) apiHealthText.textContent = 'API Connectée';
        } catch (err) {
            if (liveAmountPledged) liveAmountPledged.textContent = 'Ouvert aux souscriptions';
            if (liveProgressPct) liveProgressPct.textContent = 'Phase 1';
            if (liveInvestorsCount) liveInvestorsCount.textContent = 'Ouvert';
            if (liveSharesPledged) liveSharesPledged.textContent = '500 F / act.';
            if (apiHealthPill) apiHealthPill.classList.add('offline');
            if (apiHealthText) apiHealthText.textContent = 'Mode Hors-Ligne';
        }
    }
    loadPublicFundraisingStats();

    // =========================================================================
    // 3. Interactive Financial Scenario Switcher
    // =========================================================================
    const scenarioBtns = document.querySelectorAll('.scenario-btn');
    const scArrY3 = document.getElementById('scArrY3');
    const scArrMult = document.getElementById('scArrMult');
    const scExitMult = document.getElementById('scExitMult');
    const scValuation = document.getElementById('scValuation');
    const scRoi = document.getElementById('scRoi');
    const scRoiNote = document.getElementById('scRoiNote');
    const scTri = document.getElementById('scTri');
    const scTriNote = document.getElementById('scTriNote');
    const scVan = document.getElementById('scVan');
    const scVanNote = document.getElementById('scVanNote');

    function applyScenario(key) {
        const sc = SCENARIOS[key] || SCENARIOS.central;
        if (scArrY3) scArrY3.textContent = sc.arrY3;
        if (scArrMult) scArrMult.textContent = sc.arrMult;
        if (scExitMult) scExitMult.textContent = sc.exitMult;
        if (scValuation) scValuation.textContent = sc.valuation;
        if (scRoi) scRoi.textContent = sc.roi;
        if (scRoiNote) scRoiNote.textContent = sc.roiNote;
        if (scTri) scTri.textContent = sc.tri;
        if (scTriNote) scTriNote.textContent = sc.triNote;
        if (scVan) {
            scVan.textContent = sc.van;
            scVan.className = `mono ${sc.vanClass}`;
        }
        if (scVanNote) scVanNote.textContent = sc.vanNote;

        scenarioBtns.forEach((b) => {
            const active = b.dataset.scenario === key;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', String(active));
        });
    }

    scenarioBtns.forEach((btn) => {
        btn.addEventListener('click', () => applyScenario(btn.dataset.scenario));
    });
    applyScenario('central');

    // =========================================================================
    // 4. Synchronized Share Simulator & 3-Year Indicative Return Calculator
    // =========================================================================
    const sharesInput = document.getElementById('sharesInput');
    const formSharesCount = document.getElementById('formSharesCount');
    const totalAmountText = document.getElementById('totalAmountText');
    const roundSharePct = document.getElementById('roundSharePct');
    const simConsVal = document.getElementById('simConsVal');
    const simCentVal = document.getElementById('simCentVal');
    const simOptVal = document.getElementById('simOptVal');
    const presetBtns = document.querySelectorAll('.preset-btn');

    function formatFcfa(amount) {
        return `${Math.round(amount).toLocaleString('fr-FR')} F`;
    }

    function updateCalculations(rawValue, sourceEl = null) {
        const parsed = parseInt(rawValue, 10);
        const safeShares = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
        const totalAmount = safeShares * ACTION_PRICE;

        if (totalAmountText) totalAmountText.textContent = `${totalAmount.toLocaleString('fr-FR')} FCFA`;
        if (roundSharePct) {
            const pct = (totalAmount / PHASE1_TARGET) * 100;
            roundSharePct.textContent = pct >= 1 ? `${pct.toFixed(2)} %` : `${pct.toFixed(3)} %`;
        }
        if (simConsVal) simConsVal.textContent = formatFcfa(totalAmount * 1.61);
        if (simCentVal) simCentVal.textContent = formatFcfa(totalAmount * 2.99);
        if (simOptVal) simOptVal.textContent = formatFcfa(totalAmount * 6.28);

        if (sourceEl !== sharesInput && sharesInput && sharesInput.value !== String(safeShares)) {
            sharesInput.value = safeShares;
        }
        if (sourceEl !== formSharesCount && formSharesCount && formSharesCount.value !== String(safeShares)) {
            formSharesCount.value = safeShares;
        }

        presetBtns.forEach((btn) => {
            btn.classList.toggle('active', Number(btn.dataset.shares) === safeShares);
        });
    }

    if (sharesInput) {
        sharesInput.addEventListener('input', (e) => {
            if (e.target.value === '') return;
            updateCalculations(e.target.value, sharesInput);
        });
        sharesInput.addEventListener('blur', (e) => updateCalculations(e.target.value));
    }

    if (formSharesCount) {
        formSharesCount.addEventListener('input', (e) => {
            if (e.target.value === '') return;
            updateCalculations(e.target.value, formSharesCount);
        });
        formSharesCount.addEventListener('blur', (e) => updateCalculations(e.target.value));
    }

    presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => updateCalculations(btn.dataset.shares));
    });

    updateCalculations(100);

    // =========================================================================
    // 5. Dual-Track Switcher (Community vs Institutional Data Room)
    // =========================================================================
    const tabCommunity = document.getElementById('tabCommunity');
    const tabInstitutional = document.getElementById('tabInstitutional');
    const communityPanel = document.getElementById('communityPanel');
    const institutionalPanel = document.getElementById('institutionalPanel');
    const jumpInstitutionalBtn = document.getElementById('jumpInstitutionalBtn');

    function setTrack(track) {
        const isInst = track === 'institutional';
        if (tabCommunity) {
            tabCommunity.classList.toggle('active', !isInst);
            tabCommunity.setAttribute('aria-selected', String(!isInst));
        }
        if (tabInstitutional) {
            tabInstitutional.classList.toggle('active', isInst);
            tabInstitutional.setAttribute('aria-selected', String(isInst));
        }
        if (communityPanel) communityPanel.style.display = isInst ? 'none' : 'block';
        if (institutionalPanel) institutionalPanel.style.display = isInst ? 'block' : 'none';
    }

    if (tabCommunity) tabCommunity.addEventListener('click', () => setTrack('community'));
    if (tabInstitutional) tabInstitutional.addEventListener('click', () => setTrack('institutional'));
    if (jumpInstitutionalBtn) {
        jumpInstitutionalBtn.addEventListener('click', () => {
            setTrack('institutional');
            const target = document.getElementById('subscriptionCard');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // =========================================================================
    // 6. KYC File Upload Validation (Size <= 10 Mo + Allowed Extensions)
    // =========================================================================
    const uploadBox = document.getElementById('uploadBox');
    const kycFileInput = document.getElementById('kycFile');
    const fileInfo = document.getElementById('fileInfo');

    function resetFileBox() {
        if (kycFileInput) kycFileInput.value = '';
        if (fileInfo) fileInfo.textContent = 'Aucun fichier sélectionné (PDF, PNG, JPG, WEBP · max. 10 Mo)';
        if (uploadBox) uploadBox.classList.remove('has-file');
    }

    function handleFileSelect(file) {
        if (!file) return;
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_KYC_EXTS.includes(ext)) {
            window.showNotificationDrawer(
                'Format non pris en charge',
                'Veuillez sélectionner un document au format PDF, PNG, JPG ou WEBP.',
                true
            );
            resetFileBox();
            return;
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            window.showNotificationDrawer(
                'Fichier trop volumineux',
                'La taille du document dépasse la limite autorisée (10 Mo).',
                true
            );
            resetFileBox();
            return;
        }
        if (fileInfo) fileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} Mo)`;
        if (uploadBox) uploadBox.classList.add('has-file');
    }

    if (uploadBox && kycFileInput) {
        uploadBox.addEventListener('click', () => kycFileInput.click());
        uploadBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                kycFileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach((ev) => {
            uploadBox.addEventListener(ev, (e) => {
                e.preventDefault();
                uploadBox.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach((ev) => {
            uploadBox.addEventListener(ev, (e) => {
                e.preventDefault();
                uploadBox.classList.remove('dragover');
            });
        });

        uploadBox.addEventListener('drop', (e) => {
            const files = e.dataTransfer && e.dataTransfer.files;
            if (files && files.length > 0) {
                try {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    kycFileInput.files = dt.files;
                } catch (_) {
                    // Safari fallback: direct assignment
                    kycFileInput.files = files;
                }
                handleFileSelect(files[0]);
            }
        });

        kycFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    // =========================================================================
    // 7. Community Investment Form Submission (POST /api/investments)
    // =========================================================================
    const investmentForm = document.getElementById('investmentForm');
    const submitBtn = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const openWalletAfterPledgeBtn = document.getElementById('openWalletAfterPledgeBtn');
    const modalShares = document.getElementById('modalShares');
    const modalAmount = document.getElementById('modalAmount');

    if (investmentForm && submitBtn) {
        investmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitBtn.disabled) return;

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const sharesCount = parseInt(formSharesCount.value, 10);
            const kycFile = kycFileInput.files[0];
            const termsChecked = document.getElementById('termsCheck').checked;

            const cleanDigits = phone.replace(/\D/g, '');
            if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                window.showNotificationDrawer('Informations invalides', 'Veuillez saisir votre nom complet et une adresse e-mail valide.', true);
                return;
            }
            if (cleanDigits.length < 8) {
                window.showNotificationDrawer('Numéro invalide', 'Veuillez renseigner un numéro Mobile Money valide (ex: 77 123 45 67).', true);
                return;
            }
            if (!sharesCount || sharesCount < 1) {
                window.showNotificationDrawer('Nombre d\'actions requis', 'Veuillez indiquer au moins 1 action (500 FCFA).', true);
                return;
            }
            if (!kycFile) {
                window.showNotificationDrawer('Pièce KYC requise', 'Veuillez joindre votre CNI ou passeport (PDF, PNG ou JPG).', true);
                return;
            }
            if (!termsChecked) {
                window.showNotificationDrawer('Confirmation requise', 'Veuillez cocher la case de confirmation avant de soumettre.', true);
                return;
            }

            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement sécurisé...';

            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('sharesCount', sharesCount);
            formData.append('kycFile', kycFile);

            try {
                const response = await requestFn('/api/investments', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    if (modalShares) modalShares.textContent = sharesCount.toLocaleString('fr-FR');
                    if (modalAmount) modalAmount.textContent = `${(sharesCount * ACTION_PRICE).toLocaleString('fr-FR')} FCFA`;
                    if (successModal) successModal.classList.add('active');

                    // Pre-fill login modal for convenience
                    const loginEmailEl = document.getElementById('loginEmail');
                    const loginPhoneEl = document.getElementById('loginPhone');
                    if (loginEmailEl) loginEmailEl.value = email;
                    if (loginPhoneEl) loginPhoneEl.value = phone;

                    investmentForm.reset();
                    resetFileBox();
                    updateCalculations(100);
                    loadPublicFundraisingStats();
                } else {
                    window.showNotificationDrawer('Erreur de souscription', data.error || 'Une erreur inattendue est survenue.', true);
                }
            } catch (error) {
                window.showNotificationDrawer('Erreur réseau', error.message || 'Impossible de joindre le serveur TranSen.', true);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        });
    }

    // =========================================================================
    // 8. Institutional / Business Angel Data Room Form (POST /api/contact)
    // =========================================================================
    const institutionalForm = document.getElementById('institutionalForm');
    const instSubmitBtn = document.getElementById('instSubmitBtn');

    if (institutionalForm && instSubmitBtn) {
        institutionalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (instSubmitBtn.disabled) return;

            const name = document.getElementById('instName').value.trim();
            const org = document.getElementById('instOrg').value.trim();
            const email = document.getElementById('instEmail').value.trim();
            const phone = document.getElementById('instPhone').value.trim();
            const ticket = document.getElementById('instTicket').value;
            const message = document.getElementById('instMessage').value.trim();

            if (!name || !org || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, '').length < 8) {
                window.showNotificationDrawer(
                    'Champs requis',
                    'Veuillez renseigner votre nom, structure, e-mail professionnel et téléphone.',
                    true
                );
                return;
            }

            const origHtml = instSubmitBtn.innerHTML;
            instSubmitBtn.disabled = true;
            instSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transmission en cours...';

            try {
                const payload = {
                    profile: 'INVESTISSEUR_INSTITUTIONNEL',
                    name: `${name} (${org})`,
                    email,
                    phone,
                    message: `[DEMANDE DATA ROOM — ${ticket}] ${message || 'Souhaite recevoir le Business Plan complet et le modèle financier Phase 1.'}`
                };
                const res = await requestFn('/api/contact', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    window.showNotificationDrawer(
                        'Demande Data Room transmise',
                        'Merci ! Mouhamadou Fadilou Ndiaye et l\'équipe Relations Investisseurs reviendront vers vous sous 24h ouvrées.',
                        false
                    );
                    institutionalForm.reset();
                } else {
                    window.showNotificationDrawer('Envoi refusé', data.message || data.error || 'Veuillez réessayer.', true);
                }
            } catch (err) {
                window.showNotificationDrawer('Erreur réseau', err.message || 'Impossible de contacter le serveur.', true);
            } finally {
                instSubmitBtn.disabled = false;
                instSubmitBtn.innerHTML = origHtml;
            }
        });
    }

    // =========================================================================
    // 9. Modals (Success & Portfolio Login) + Escape Key
    // =========================================================================
    const loginModal = document.getElementById('loginModal');
    const openLoginBtn = document.getElementById('openLoginBtn');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener('click', () => successModal.classList.remove('active'));
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) successModal.classList.remove('active');
        });
    }

    if (openWalletAfterPledgeBtn && successModal && loginModal) {
        openWalletAfterPledgeBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }

    if (openLoginBtn && loginModal) {
        openLoginBtn.addEventListener('click', () => loginModal.classList.add('active'));
    }
    if (closeLoginModalBtn && loginModal) {
        closeLoginModalBtn.addEventListener('click', () => loginModal.classList.remove('active'));
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.classList.remove('active');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (successModal) successModal.classList.remove('active');
            if (loginModal) loginModal.classList.remove('active');
            if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');
        }
    });

    if (loginForm && loginSubmitBtn) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginSubmitBtn.disabled) return;

            const email = document.getElementById('loginEmail').value.trim();
            const phone = document.getElementById('loginPhone').value.trim();

            if (!email && !phone) {
                window.showNotificationDrawer('Identifiants requis', 'Veuillez renseigner votre e-mail ou votre numéro de téléphone.', true);
                return;
            }

            const originalBtnHtml = loginSubmitBtn.innerHTML;
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

            try {
                const response = await requestFn('/api/investments/login', {
                    method: 'POST',
                    skipIdempotency: true,
                    body: JSON.stringify({ email: email || null, phone: phone || null })
                });
                const data = await response.json().catch(() => ({}));

                if (response.ok && Array.isArray(data) && data.length > 0) {
                    localStorage.setItem('transenInvestor', JSON.stringify(data));
                    if (email) localStorage.setItem('transenInvestorEmail', email);
                    if (phone) localStorage.setItem('transenInvestorPhone', phone);
                    window.location.href = 'dashboard.html';
                } else {
                    window.showNotificationDrawer('Aucun dossier trouvé', data.error || 'Aucun investissement trouvé avec ces identifiants.', true);
                }
            } catch (error) {
                window.showNotificationDrawer('Erreur de connexion', error.message || 'Impossible de vérifier vos identifiants.', true);
            } finally {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.innerHTML = originalBtnHtml;
            }
        });
    }

    // =========================================================================
    // 10. Aurora Telemetry Beacon & Super-Admin Emergency Broadcast Receiver
    // =========================================================================
    fetch(`${API_HOST}/api/system/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Transen-Platform': 'investir.transen.org' },
        body: JSON.stringify({
            featureKey: 'INVESTOR_PORTAL_SUBSCRIPTION',
            platform: 'investir.transen.org',
            latencyMs: 18,
            isError: false
        })
    })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
            if (data && data.emergencyBanner && String(data.emergencyBanner).trim()) {
                const banner = document.createElement('div');
                banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#9f1239,#e11d48,#b45309);color:#fff;padding:8px 18px;font-size:0.8rem;font-weight:800;text-align:center;letter-spacing:0.03em;box-shadow:0 6px 20px rgba(244,63,94,0.45);';
                banner.textContent = 'ALERTE CENTRE DE COMMANDEMENT TRANSEN : ' + String(data.emergencyBanner).trim();
                document.body.prepend(banner);
            }
        })
        .catch(() => {});
});
