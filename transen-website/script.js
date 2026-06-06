// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Scroll Reveal Animation
function reveal() {
    var reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add('active');
        }
    }
}

window.addEventListener('scroll', reveal);
reveal(); // Trigger on load

// Mobile Menu Toggle logic using active CSS classes
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navActions = document.querySelector('.nav-actions');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    navActions.classList.toggle('active');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navActions.classList.remove('active');
    });
});

// Form Submission handling
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // On bloque l'envoi classique
    const btn = this.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    btn.disabled = true;

    const data = {
        profile: document.getElementById('profile').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch('https://api.transen.org/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Envoyé avec succès !';
            btn.style.backgroundColor = '#D4AF37'; // Gold
            setTimeout(() => {
                this.reset();
                btn.innerHTML = originalText;
                btn.style.backgroundColor = 'var(--primary-green)';
                btn.disabled = false;
            }, 3000);
        } else {
            alert("Erreur: " + (result.message || "Une erreur est survenue."));
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Erreur d'envoi:", error);
        alert("Erreur de connexion au serveur.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
