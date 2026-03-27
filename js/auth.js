// --- Auth & User Management Logic ---

function checkAuth() {
    const overlay = document.getElementById('login-overlay');
    
    // --- BYPASS FOR NETLIFY REVIEW ---
    if (!state.currentUser) {
        state.currentUser = {
            username: 'invitado_demo',
            role: 'admin', // Use admin for review to show all features
            avatar: '👤'
        };
        sessionStorage.setItem('endo_current_user', JSON.stringify(state.currentUser));
        sessionStorage.setItem('endo_token', 'demo_token_for_review');
    }

    document.body.classList.remove('login-active');
    if (overlay) overlay.style.display = 'none';
    
    document.getElementById('current-user-name').innerText = state.currentUser.username;
    document.getElementById('current-user-role').innerText = state.currentUser.role === 'admin' ? 'Administrador (Demo)' : 'Médico General';
    
    // Show/hide admin-only elements
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => el.style.display = state.currentUser.role === 'admin' ? 'flex' : 'none');
    
    updateAvatarDisplay();
    if (state.currentUser.role === 'admin' && typeof renderUsers === 'function') renderUsers();
}

async function handleLogin() {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch('https://endohn.netlify.app/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            state.currentUser = data.user;
            sessionStorage.setItem('endo_current_user', JSON.stringify(data.user));
            sessionStorage.setItem('endo_token', data.token);
            errorEl.style.display = 'none';
            checkAuth();
            
            // Clear inputs
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
        } else {
            errorEl.innerText = data.error || 'Usuario o contraseña incorrectos';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        console.error('Login error:', err);
        errorEl.innerText = 'Error conectando al servidor';
        errorEl.style.display = 'block';
    }
}

function handleLogout() {
    state.currentUser = null;
    sessionStorage.removeItem('endo_current_user');
    sessionStorage.removeItem('endo_token');
    checkAuth();
    switchMainView('new');
}

// --- Idle Timeout Security ---
let idleTimeout;
const IDLE_TIME_MS = 15 * 60 * 1000; // 15 minutos

function resetIdleTimeout() {
    if (!sessionStorage.getItem('endo_token')) return;
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        alert("Tu sesión ha sido cerrada automáticamente por inactividad (15 minutos). Por seguridad, vuelve a ingresar.");
        handleLogout();
    }, IDLE_TIME_MS);
}

// Escuchar eventos de interacción
['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimeout);
});
resetIdleTimeout();
