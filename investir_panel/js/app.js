document.addEventListener('DOMContentLoaded', () => {
    // API Configuration
    const API_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8081'
        : 'https://api.transen.org';

    // DOM Elements
    const sharesInput = document.getElementById('sharesInput');
    const formSharesCount = document.getElementById('formSharesCount');
    const totalAmountText = document.getElementById('totalAmountText');
    
    const uploadBox = document.getElementById('uploadBox');
    const kycFileInput = document.getElementById('kycFile');
    const fileInfo = document.getElementById('fileInfo');
    
    const investmentForm = document.getElementById('investmentForm');
    const submitBtn = document.getElementById('submitBtn');
    
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalShares = document.getElementById('modalShares');
    const modalAmount = document.getElementById('modalAmount');

    // Constants
    const ACTION_PRICE = 500; // 500 FCFA

    // 1. Synchronize share fields & calculate cost
    function updateCalculations(sharesValue) {
        let shares = parseInt(sharesValue) || 0;
        if (shares < 1) shares = 1;
        
        const totalAmount = shares * ACTION_PRICE;
        totalAmountText.innerText = totalAmount.toLocaleString('fr-FR') + ' FCFA';
        
        // Update both fields to remain in sync
        if (sharesInput.value !== shares.toString()) {
            sharesInput.value = shares;
        }
        if (formSharesCount.value !== shares.toString()) {
            formSharesCount.value = shares;
        }
    }

    sharesInput.addEventListener('input', (e) => {
        updateCalculations(e.target.value);
    });

    formSharesCount.addEventListener('input', (e) => {
        updateCalculations(e.target.value);
    });

    // Run initial calculation
    updateCalculations(100);

    // 2. Custom File Upload Logic
    uploadBox.addEventListener('click', () => {
        kycFileInput.click();
    });

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadBox.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadBox.classList.remove('dragover');
        }, false);
    });

    uploadBox.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            kycFileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    kycFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("La taille du fichier dépasse la limite autorisée (10 Mo).");
            kycFileInput.value = '';
            fileInfo.innerText = "Aucun fichier sélectionné (PDF, PNG, JPG max. 10 Mo)";
            uploadBox.classList.remove('has-file');
            return;
        }

        // Update UI
        fileInfo.innerText = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} Mo)`;
        uploadBox.classList.add('has-file');
    }

    // 3. Form Submission
    investmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const sharesCount = parseInt(formSharesCount.value);
        const kycFile = kycFileInput.files[0];

        if (!fullName || !email || !phone || !sharesCount || !kycFile) {
            alert("Veuillez remplir tous les champs obligatoires (y compris l'e-mail) et ajouter votre pièce d'identité.");
            return;
        }

        // Set Loading state
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement en cours...';

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('sharesCount', sharesCount);
        formData.append('kycFile', kycFile);

        try {
            const response = await fetch(`${API_HOST}/api/investments`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Populate and show success modal
                modalShares.innerText = sharesCount.toLocaleString('fr-FR');
                modalAmount.innerText = (sharesCount * ACTION_PRICE).toLocaleString('fr-FR') + ' FCFA';
                successModal.classList.add('active');

                // Reset Form
                investmentForm.reset();
                kycFileInput.value = '';
                fileInfo.innerText = "Aucun fichier sélectionné (PDF, PNG, JPG max. 10 Mo)";
                uploadBox.classList.remove('has-file');
                updateCalculations(100);
            } else {
                alert("Erreur: " + (data.error || "Une erreur inattendue est survenue."));
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Erreur de connexion avec le serveur. Veuillez réessayer plus tard.");
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });

    // 4. Modal Close Logic
    closeModalBtn.addEventListener('click', () => {
        successModal.classList.remove('active');
    });

    // Close on click outside card
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('active');
        }
    });
});
