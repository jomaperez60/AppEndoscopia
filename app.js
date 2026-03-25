const state = {
    patient: {
        nombre: '',
        dni: '',
        fnacimiento: '',
        sexo: '',
        departamento: '',
        municipio: '',
        antecedentes: '',
        edad: ''
    },
    clinical: {
        referente: '',
        asa: 'ASA I (Normal, sano)',
        anticoagulante: 'No',
        preparacion: 'Adecuado (Ayuno > 8h)'
    },
    quality: {
        consentimiento: 'Sí, obtenido y firmado',
        fotos: 'Estándar (≥ 10 fotos)',
        completa: 'Sí (incluye retrovisión)',
        tiempo: '≥ 7 minutos'
    },
    images: [], // { data, x, y, id, label }
    selectedImageIndex: null,
    history: JSON.parse(localStorage.getItem('endo_history') || '[]'),
    metadata: {
        indicacion: '',
        sedacion: 'Sedación Consciente',
        instrumento: 'Olympus',
        extension: 'Duodeno D2'
    },
    findings: [],
    procedimientos: [],
    plan: '',
    users: JSON.parse(localStorage.getItem('endo_users') || '[{"username":"admin","password":"admin","role":"admin","avatar":"Dr"}]'),
    currentUser: JSON.parse(sessionStorage.getItem('endo_current_user') || 'null'),
    settings: JSON.parse(localStorage.getItem('endo_settings') || '{"hospital":"Hospital Local","physician":"Dr. Clínico","location":"","specialty":"","language":"es","units":"cm","logo":null}'),
    tagColors: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#ec4899'],
    currentStudyId: null
};

let isDraggingTag = false;

function calculateAge(dateString) {
    if (!dateString) { state.patient.edad = ''; updateTopbar(); return; }
    
    let birthDate;
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY-MM-DD (ISO)
            birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else { // DD-MM-YYYY or DD/MM/YYYY
            birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
    } else {
        birthDate = new Date(dateString);
    }
    
    if (isNaN(birthDate.getTime())) { state.patient.edad = ''; updateTopbar(); return; }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    state.patient.edad = Math.max(0, age);
    updateTopbar();
}

function formatDate(dateInput) {
    if (!dateInput) return '-';
    const val = String(dateInput).trim();
    
    // 1. Handle DD-MM-YYYY or DD/MM/YYYY (Latin)
    const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(val);
    if (dmyMatch) {
         return `${dmyMatch[1].padStart(2, '0')}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[3]}`;
    }

    // 2. Handle ISO YYYY-MM-DD (Input Date)
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(val);
    if (isoMatch) {
         return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return val;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function updateTopbar() {
    document.getElementById('topbar-name').innerText = state.patient.nombre || 'Nuevo Paciente';
    document.getElementById('topbar-dni').innerText = `DNI: ${state.patient.dni || '-'}`;
    document.getElementById('topbar-age').innerText = `Edad: ${state.patient.edad !== '' ? state.patient.edad + ' años' : '-'}`;
    document.getElementById('topbar-sex').innerText = `Sexo: ${state.patient.sexo ? state.patient.sexo.charAt(0) : '-'}`;
}

let currentOrgan = '';
let currentWgoLocation = [];
let currentMstSelection = [];
var currentIndicationsSelection = [];
let currentDiagnosesSelection = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Flatpickr for Birth Date
    flatpickr("#paciente-fnacimiento", {
        dateFormat: "d-m-Y",
        locale: "es",
        allowInput: true,
        onChange: function(selectedDates, dateStr) {
            calculateAge(dateStr);
            state.patient.fnacimiento = dateStr;
        }
    });

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).style.display = 'block';
            // Removed auto-diagnoses to prevent overwriting standardized selections
        });
    });

    ['indicacion', 'sedacion', 'instrumento', 'extension'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener(id === 'indicacion' ? 'input' : 'change', (e) => {
                state.metadata[id] = e.target.value;
            });
        }
    });

    ['referente', 'asa', 'anticoagulante', 'preparacion'].forEach(id => {
        const el = document.getElementById(`clinico-${id}`);
        if(el) {
            el.addEventListener(id === 'referente' ? 'input' : 'change', (e) => state.clinical[id] = e.target.value);
        }
    });

    ['consentimiento', 'fotos', 'completa', 'tiempo'].forEach(id => {
        const el = document.getElementById(`calidad-${id}`);
        if(el) el.addEventListener('change', (e) => state.quality[id] = e.target.value);
    });

    ['nombre', 'dni', 'fnacimiento', 'sexo', 'antecedentes'].forEach(field => {
        const el = document.getElementById(`paciente-${field}`);
        if(el) {
            el.addEventListener('input', (e) => {
                state.patient[field] = e.target.value;
                updateTopbar();
            });
        }
    });

    const deptoSelect = document.getElementById('paciente-departamento');
    const muniSelect = document.getElementById('paciente-municipio');
    
    if (deptoSelect && typeof hondurasGeo !== 'undefined') {
        Object.keys(hondurasGeo).sort().forEach(depto => {
            const opt = document.createElement('option');
            opt.value = depto;
            opt.innerText = depto;
            deptoSelect.appendChild(opt);
        });

        deptoSelect.addEventListener('change', (e) => {
            state.patient.departamento = e.target.value;
            state.patient.municipio = '';
            
            muniSelect.innerHTML = '<option value="">Seleccione Municipio...</option>';
            if (e.target.value) {
                muniSelect.disabled = false;
                hondurasGeo[e.target.value].sort().forEach(muni => {
                    const opt = document.createElement('option');
                    opt.value = muni;
                    opt.innerText = muni;
                    muniSelect.appendChild(opt);
                });
            } else {
                muniSelect.disabled = true;
            }
        });
        
        muniSelect.addEventListener('change', (e) => {
            state.patient.municipio = e.target.value;
        });
    }

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sideNav = document.querySelector('.sidebar nav');
    if(mobileMenuToggle && sideNav) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sideNav.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            if(sideNav.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (sideNav.classList.contains('active') && !sideNav.contains(e.target) && e.target !== mobileMenuToggle) {
                sideNav.classList.remove('active');
                mobileMenuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
            }
        });
        
        // Close menu when clicking a nav item
        sideNav.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                sideNav.classList.remove('active');
                mobileMenuToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
            });
        });
    }

    updateTopbar();
    checkAuth();
});

// --- Auth & User Management Logic ---

function checkAuth() {
    const overlay = document.getElementById('login-overlay');
    const token = sessionStorage.getItem('endo_token');
    
    if (token && state.currentUser) {
        document.body.classList.remove('login-active');
        overlay.style.display = 'none';
        document.getElementById('current-user-name').innerText = state.currentUser.username;
        document.getElementById('current-user-role').innerText = state.currentUser.role === 'admin' ? 'Administrador' : 'Médico General';
        
        // Show/hide admin-only elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => el.style.display = state.currentUser.role === 'admin' ? 'flex' : 'none');
        
        updateAvatarDisplay();
        if (state.currentUser.role === 'admin') renderUsers();
    } else {
        document.body.classList.add('login-active');
        overlay.style.display = 'flex';
    }
}

async function handleLogin() {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
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

async function renderUsers() {
    const body = document.getElementById('users-table-body');
    if (!body) return;

    const token = sessionStorage.getItem('endo_token');
    if (!token) return;

    try {
        const res = await fetch('http://localhost:3000/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const users = await res.json();
        state.users = users;

        body.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px;">
                    <span class="clickable-name" onclick="openPasswordModal('${u.username}')">${u.username}</span>
                </td>
                <td style="padding: 12px;">
                    <span class="${u.role}-badge">${u.role === 'admin' ? 'Admin' : 'Médico'}</span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    ${u.username !== 'admin' ? `
                        <button class="btn btn-icon" onclick="deleteUser('${u.username}')" style="color: var(--danger);"><i class="fa-solid fa-user-minus"></i></button>
                    ` : '<span style="font-size: 0.7rem; color: var(--text-muted);">Sistema</span>'}
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Error fetching users:", e);
    }
}

function openUserModal() { document.getElementById('user-modal').classList.add('active'); }
function closeUserModal() { document.getElementById('user-modal').classList.remove('active'); }

async function saveNewUser() {
    const user = document.getElementById('new-username').value.trim();
    const pass = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    if (!user || !pass) { alert("Por favor, complete todos los campos."); return; }

    const token = sessionStorage.getItem('endo_token');
    try {
        const res = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ username: user, password: pass, role })
        });
        
        if (res.ok) {
            closeUserModal();
            renderUsers();
            alert("Usuario creado exitosamente.");
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Algo salió mal."));
        }
    } catch (e) {
        alert("Error de conexión.");
    }
}

async function deleteUser(username) {
    if (confirm(`¿Está seguro de eliminar al usuario ${username}?`)) {
        const token = sessionStorage.getItem('endo_token');
        try {
            const res = await fetch(`http://localhost:3000/users/${username}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                renderUsers();
            } else {
                alert("Error al eliminar usuario.");
            }
        } catch(e) { console.error(e); }
    }
}

let userToPasswordChange = '';
function openPasswordModal(username) {
    // Only admin can change others' passwords, or a user can change their own
    if (state.currentUser.role !== 'admin' && state.currentUser.username !== username) return;
    userToPasswordChange = username;
    document.getElementById('password-modal').classList.add('active');
}

async function handleChangePassword() {
    const newPass = document.getElementById('change-password-new').value;
    if (!newPass) return;

    const token = sessionStorage.getItem('endo_token');
    try {
        const res = await fetch(`http://localhost:3000/users/${userToPasswordChange}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ newPassword: newPass })
        });
        
        if (res.ok) {
            alert("Contraseña actualizada exitosamente.");
            document.getElementById('password-modal').classList.remove('active');
            renderUsers();
        } else {
            alert("Error al actualizar la contraseña.");
        }
    } catch(e) { alert("Error de conexión"); }
}

// --- Settings Logic ---

function renderSettings() {
    if (!state.currentUser) return;
    
    document.getElementById('settings-username').value = state.currentUser.username;
    document.getElementById('settings-hospital').value = state.settings.hospital || '';
    document.getElementById('settings-location').value = state.settings.location || '';
    document.getElementById('settings-physician').value = state.settings.physician || '';
    document.getElementById('settings-specialty').value = state.settings.specialty || '';
    document.getElementById('settings-language').value = state.settings.language || 'es';
    document.getElementById('settings-units').value = state.settings.units || 'cm';
    
    updateAvatarDisplay();
    updateLogoDisplay();
}

function updateLogoDisplay() {
    const preview = document.getElementById('settings-logo-preview');
    if (!preview) return;
    if (state.settings.logo) {
        preview.innerHTML = `<img src="${state.settings.logo}" style="width: 100%; height: 100%; object-fit: contain;">`;
    } else {
        preview.innerHTML = `<i class="fa-solid fa-image" style="color: #ccc;"></i>`;
    }
}

function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        state.settings.logo = e.target.result;
        localStorage.setItem('endo_settings', JSON.stringify(state.settings));
        updateLogoDisplay();
    };
    reader.readAsDataURL(file);
}

function saveSettings() {
    state.settings.hospital = document.getElementById('settings-hospital').value;
    state.settings.location = document.getElementById('settings-location').value;
    state.settings.physician = document.getElementById('settings-physician').value;
    state.settings.specialty = document.getElementById('settings-specialty').value;
    state.settings.language = document.getElementById('settings-language').value;
    state.settings.units = document.getElementById('settings-units').value;
    
    localStorage.setItem('endo_settings', JSON.stringify(state.settings));
    alert("Configuración guardada correctamente.");
}

function updateAvatarDisplay() {
    const avatars = [document.getElementById('current-user-avatar'), document.getElementById('settings-avatar-preview')];
    const avatarData = state.currentUser.avatar || 'Dr';
    
    avatars.forEach(avatarEl => {
        if (!avatarEl) return;
        if (avatarData.startsWith('data:image')) {
            avatarEl.style.backgroundImage = `url(${avatarData})`;
            avatarEl.innerText = '';
        } else {
            avatarEl.style.backgroundImage = 'none';
            avatarEl.innerText = avatarData;
        }
    });
}

function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        state.currentUser.avatar = e.target.result;
        updateUserInDB(state.currentUser);
        updateAvatarDisplay();
    };
    reader.readAsDataURL(file);
}

const emojisList = ['👨‍⚕️', '👩‍⚕️', '🩺', '🔬', '🏥', '🧠', '🫀', '🦷', '🧪', '🥑', '🍎', '🏃', '🧘', '✨', '⭐', '🔷', '🔶', '📁', '📄', '🛡️'];

function openEmojiPicker() {
    const modal = document.getElementById('emoji-modal');
    const list = document.getElementById('emoji-list');
    modal.classList.add('active');
    
    list.innerHTML = emojisList.map(e => `
        <div class="emoji-item" onclick="selectEmoji('${e}')">${e}</div>
    `).join('');
}

function closeEmojiPicker() { document.getElementById('emoji-modal').classList.remove('active'); }

function selectEmoji(emoji) {
    state.currentUser.avatar = emoji;
    updateUserInDB(state.currentUser);
    updateAvatarDisplay();
    closeEmojiPicker();
}

function updateUserInDB(user) {
    const idx = state.users.findIndex(u => u.username === user.username);
    if (idx !== -1) {
        state.users[idx] = { ...user };
        localStorage.setItem('endo_users', JSON.stringify(state.users));
        sessionStorage.setItem('endo_current_user', JSON.stringify(user));
    }
}

function resetSettings() {
    if (confirm("¿Restablecer todos los ajustes a los valores iniciales?")) {
        state.settings = { hospital: "Hospital Local", physician: "Dr. Clínico", location: "", specialty: "", language: "es", units: "cm" };
        localStorage.setItem('endo_settings', JSON.stringify(state.settings));
        renderSettings();
    }
}

function toggleLanguage(lang) {
    state.settings.language = lang;
    localStorage.setItem('endo_settings', JSON.stringify(state.settings));
    alert("Idioma cambiado a: " + (lang === 'es' ? 'Español' : 'Inglés') + ". (Traducción parcial en esta versión)");
}

function switchMainView(view) {
    const newView = document.getElementById('dynamic-view');
    const historyView = document.getElementById('history-view');
    const usersView = document.getElementById('users-view');
    const settingsView = document.getElementById('settings-view');
    const newActions = document.getElementById('topbar-actions');
    const historyActions = document.getElementById('history-actions');
    const navNew = document.getElementById('nav-new');
    const navHistory = document.getElementById('nav-history');
    const navUsers = document.getElementById('nav-users');
    const navSettings = document.getElementById('nav-settings');

    // Hide all views first
    [newView, historyView, usersView, settingsView].forEach(v => { if(v) v.style.display = 'none'; });
    [newActions, historyActions].forEach(a => { if(a) a.style.display = 'none'; });
    [navNew, navHistory, navUsers, navSettings].forEach(n => { if(n) n.classList.remove('active'); });

    if (view === 'new') {
        if(newView) newView.style.display = 'block';
        if(newActions) newActions.style.display = 'flex';
        navNew.classList.add('active');
        document.getElementById('topbar-name').textContent = state.patient.nombre || "Nuevo Paciente";
    } else if (view === 'history') {
        if(historyView) historyView.style.display = 'block';
        if(historyActions) historyActions.style.display = 'flex';
        navHistory.classList.add('active');
        document.getElementById('topbar-name').textContent = "Base de Datos de Pacientes";
        renderHistory();
    } else if (view === 'settings') {
        if(settingsView) settingsView.style.display = 'block';
        navSettings.classList.add('active');
        document.getElementById('topbar-name').textContent = "Configuración del Sistema";
        renderSettings();
    } else if (view === 'users') {
        if(usersView) usersView.style.display = 'block';
        navUsers.classList.add('active');
        document.getElementById('topbar-name').textContent = "Gestión de Usuarios";
        renderUsers();
    }
}

function openFindings(organ) {
    currentOrgan = organ;
    currentWgoLocation = [];
    currentMstSelection = [];
    document.getElementById('mst-title').innerText = `Localización: ${organ}`;
    const body = document.getElementById('mst-body');
    body.innerHTML = '';
    renderWgoLocations(wgoLocations[organ], body, 0);
    document.getElementById('mst-modal').classList.add('active');
}

function renderWgoLocations(data, container, level) {
    if (!data) return;

    // Clear subsequent levels
    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Localización:' : 'Sub-localización:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    if (Array.isArray(data)) {
        if (data.length === 0) {
            // No sub-locations, move to MST
            proceedToMst(container);
            return;
        }
        data.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                currentWgoLocation[level] = item;
                currentWgoLocation.splice(level + 1);
                proceedToMst(container);
            };
            grid.appendChild(btn);
        });
    } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                currentWgoLocation[level] = key;
                currentWgoLocation.splice(level + 1);
                if (data[key] && data[key].length > 0) {
                    renderWgoLocations(data[key], container, level + 1);
                } else {
                    proceedToMst(container);
                }
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function proceedToMst(container) {
    const divider = document.createElement('hr');
    divider.className = 'mst-divider';
    container.appendChild(divider);
    
    document.getElementById('mst-title').innerText = `Hallazgos en ${currentOrgan} (${currentWgoLocation.join(' - ')})`;
    renderMstLevel(mstTree[currentOrgan], container, container.children.length);
}

function renderMstLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    // Check if it's a multi-attribute container
    if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj);
        const isMulti = keys.length > 1 && keys.every(k => Array.isArray(dataObj[k]) || (typeof dataObj[k] === 'object' && Object.keys(dataObj[k]).length === 0));
        
        if (isMulti) {
            renderAttributeGroups(dataObj, container, level);
            return;
        }
    }

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Categoría:' : 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        const oldSpec = div.querySelector('.spec-container');
        if (oldSpec) oldSpec.remove();

        currentMstSelection[level] = item;
        currentMstSelection.splice(level + 1);
        
        if (item.toLowerCase().includes('(especificar)')) {
            const specDiv = document.createElement('div');
            specDiv.className = 'spec-container';
            specDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 6px;';
            specDiv.innerHTML = `
                <label style="display:block; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">DETALLE ADICIONAL:</label>
                <input type="text" placeholder="Escriba el detalle aquí..." 
                       style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; background: var(--bg-dark); color: var(--text-main);"
                       oninput="updateMstSpec(${level}, '${item}', this.value)">
            `;
            div.appendChild(specDiv);
        }
    };

    if (Array.isArray(dataObj)) {
        if (dataObj.length === 0) return;
        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(item);
            };
            grid.appendChild(btn);
        });
    } else if (typeof dataObj === 'object') {
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(key);
                renderMstLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function renderAttributeGroups(dataObj, container, level) {
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mst-multi-container';
    mainDiv.style.cssText = 'margin-top: 10px; border-top: 1px solid var(--border); padding-top: 15px;';
    
    currentMstSelection[level] = { __multi: true, values: {} };
    currentMstSelection.splice(level + 1);

    Object.keys(dataObj).forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mst-attribute-group';
        groupDiv.style.marginBottom = '20px';
        groupDiv.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; margin-bottom: 8px;">${groupKey.toUpperCase()}:</h4><div class="mst-grid"></div>`;
        const grid = groupDiv.querySelector('.mst-grid');
        
        const options = dataObj[groupKey];
        if (Array.isArray(options)) {
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'mst-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    
                    const oldSpec = groupDiv.querySelector('.spec-container');
                    if (oldSpec) oldSpec.remove();

                    currentMstSelection[level].values[groupKey] = opt;

                    if (opt.toLowerCase().includes('(especificar)')) {
                        const specDiv = document.createElement('div');
                        specDiv.className = 'spec-container';
                        specDiv.style.cssText = 'margin-top: 8px; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 4px;';
                        specDiv.innerHTML = `<input type="text" placeholder="Detalle..." style="width: 100%; padding: 6px 10px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px;" oninput="updateMstMultiSpec(${level}, '${groupKey}', '${opt}', this.value)">`;
                        groupDiv.appendChild(specDiv);
                    }
                };
                grid.appendChild(btn);
            });
        }
        mainDiv.appendChild(groupDiv);
    });
    container.appendChild(mainDiv);
}

function updateMstMultiSpec(level, groupKey, baseItem, value) {
    if (baseItem.trim() === '(especificar)') {
        currentMstSelection[level].values[groupKey] = value.trim() || baseItem;
    } else {
        const cleanItem = baseItem.replace('(especificar)', '').trim();
        currentMstSelection[level].values[groupKey] = value.trim() ? `${cleanItem} ${value}` : baseItem;
    }
}

function updateMstSpec(level, baseItem, value) {
    if (baseItem.trim() === '(especificar)') {
        currentMstSelection[level] = value.trim() || baseItem;
    } else {
        const cleanItem = baseItem.replace('(especificar)', '').trim();
        currentMstSelection[level] = value.trim() ? `${cleanItem} ${value}` : baseItem;
    }
}

function saveFinding() {
    const cleanMst = [];
    currentMstSelection.forEach(item => {
        if (item === undefined || item === null) return;
        if (typeof item === 'object' && item.__multi) {
            Object.entries(item.values).forEach(([k, v]) => {
                if (v && v.trim()) cleanMst.push(`${k}: ${v}`);
            });
        } else if (item && item.trim()) {
            cleanMst.push(item);
        }
    });
    
    if (cleanMst.length === 0) { alert("Debe seleccionar al menos un descriptor clínico"); return; }
    
    const locationText = currentWgoLocation.length > 0 ? currentWgoLocation.join(' - ') : 'General';
    const findingText = cleanMst.join(' - ');
    
    if (currentOrgan === 'Procedimientos') {
        state.procedimientos.push({
            description: (locationText !== 'General' ? `${locationText}: ` : '') + findingText
        });
        updateProcedimientosList();
        closeMstModal();
        return;
    }

    state.findings.push({ 
        organ: currentOrgan, 
        location: locationText,
        description: findingText 
    });

    if (currentOrgan === 'Exploración') {
        const input = document.getElementById('extension');
        if (input) {
            input.value = `${locationText}: ${findingText}`;
            input.dispatchEvent(new Event('input'));
        }
        state.metadata.extension = input.value;
    }

    closeMstModal();
    updateFindingsList();
}

function updateProcedimientosList() {
    const container = document.getElementById('procedimientos-container');
    if (!container) return;

    if (state.procedimientos.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No se han registrado procedimientos adicionales en este estudio.</p>';
        return;
    }

    container.innerHTML = '';
    state.procedimientos.forEach((proc, idx) => {
        const div = document.createElement('div');
        div.className = 'finding-item';
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px;';
        
        const content = document.createElement('div');
        content.innerHTML = `<span style="color: var(--primary); font-weight: 600; margin-right: 10px;">PRO:</span> <span>${proc.description}</span>`;
        
        const btn = document.createElement('button');
        btn.className = 'btn-icon';
        btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        btn.style.color = 'var(--danger)';
        btn.onclick = () => deleteProcedimiento(idx);
        
        div.appendChild(content);
        div.appendChild(btn);
        container.appendChild(div);
    });
}

function deleteProcedimiento(index) {
    state.procedimientos.splice(index, 1);
    updateProcedimientosList();
}

function closeMstModal() { document.getElementById('mst-modal').classList.remove('active'); }
function deleteFinding(index) { state.findings.splice(index, 1); updateFindingsList(); }

// --- Indications Logic ---

function openIndications() {
    currentIndicationsSelection = [];
    document.getElementById('indications-title').innerText = "Seleccionar Indicación";
    document.getElementById('indications-body').innerHTML = '';
    renderIndicationsLevel(indicationsTree, document.getElementById('indications-body'), 0);
    document.getElementById('indications-modal').classList.add('active');
}

function renderIndicationsLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    // Check if it's a multi-attribute container
    if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj);
        const isMulti = keys.length > 1 && keys.every(k => Array.isArray(dataObj[k]) || (typeof dataObj[k] === 'object' && Object.keys(dataObj[k]).length === 0));
        
        if (isMulti) {
            renderIndicationAttributeGroups(dataObj, container, level);
            return;
        }
    }

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Categoría:' : 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        const oldSpec = div.querySelector('.spec-container');
        if (oldSpec) oldSpec.remove();

        currentIndicationsSelection[level] = item;
        currentIndicationsSelection.splice(level + 1);
        
        if (item.toLowerCase().includes('(especificar)')) {
            const specDiv = document.createElement('div');
            specDiv.className = 'spec-container';
            specDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 6px;';
            specDiv.innerHTML = `
                <label style="display:block; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">DETALLE ADICIONAL:</label>
                <input type="text" placeholder="Escriba el detalle aquí..." 
                       style="width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; background: var(--bg-dark); color: var(--text-main);"
                       oninput="updateIndicationSpec(${level}, '${item}', this.value)">
            `;
            div.appendChild(specDiv);
        }
    };

    if (Array.isArray(dataObj)) {
        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(item);
            };
            grid.appendChild(btn);
        });
    } else {
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(key);
                renderIndicationsLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function renderIndicationAttributeGroups(dataObj, container, level) {
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mst-multi-container';
    
    currentIndicationsSelection[level] = { __multi: true, values: {} };
    currentIndicationsSelection.splice(level + 1);

    Object.keys(dataObj).forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mst-attribute-group';
        groupDiv.style.marginBottom = '20px';
        groupDiv.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; margin-bottom: 8px;">${groupKey.toUpperCase()}:</h4><div class="mst-grid"></div>`;
        const grid = groupDiv.querySelector('.mst-grid');
        
        const options = dataObj[groupKey];
        if (Array.isArray(options)) {
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'mst-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    const oldSpec = groupDiv.querySelector('.spec-container');
                    if (oldSpec) oldSpec.remove();

                    currentIndicationsSelection[level].values[groupKey] = opt;

                    if (opt.toLowerCase().includes('(especificar)')) {
                        const specDiv = document.createElement('div');
                        specDiv.className = 'spec-container';
                        specDiv.style.cssText = 'margin-top: 8px; padding: 10px; background: rgba(0,0,0,0.03); border: 1px solid var(--border); border-radius: 4px;';
                        specDiv.innerHTML = `<input type="text" placeholder="Detalle..." style="width: 100%; padding: 6px 10px; background: var(--bg-dark); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px;" oninput="updateIndicationMultiSpec(${level}, '${groupKey}', '${opt}', this.value)">`;
                        groupDiv.appendChild(specDiv);
                    }
                };
                grid.appendChild(btn);
            });
        }
        mainDiv.appendChild(groupDiv);
    });
    container.appendChild(mainDiv);
}

function updateIndicationMultiSpec(level, groupKey, baseItem, value) {
    const cleanItem = baseItem.replace('(especificar)', '').trim();
    currentIndicationsSelection[level].values[groupKey] = value.trim() ? `${cleanItem}: ${value}` : cleanItem;
}

function saveIndication() {
    if (currentIndicationsSelection.length === 0) {
        console.warn("No selection made in Indications modal.");
        return;
    }
    
    const filtered = currentIndicationsSelection.filter(item => item !== undefined && item !== null).map(item => {
        if (typeof item === 'object' && item.__multi) {
            return Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return item;
    });
    const text = filtered.join(' - ');
    
    console.log("Saving indication text:", text);
    
    const input = document.getElementById('indicacion');
    if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input'));
    }
    
    state.metadata.indicacion = text;
    closeIndications();
}

function updateIndicationSpec(level, baseItem, value) {
    if (!currentIndicationsSelection) currentIndicationsSelection = [];
    const cleanItem = baseItem.replace('(especificar)', '').trim();
    currentIndicationsSelection[level] = value.trim() ? `${cleanItem}: ${value}` : cleanItem;
}

function closeIndications() { document.getElementById('indications-modal').classList.remove('active'); }

// --- Standardized Diagnoses Logic ---

function openDiagnosesModal() {
    currentDiagnosesSelection = [];
    document.getElementById('diagnoses-modal').classList.add('active');
    document.getElementById('current-diag-preview').innerText = '';
    const body = document.getElementById('diagnoses-body');
    body.innerHTML = '';
    renderDiagnosesLevel(diagnosesTree, body, 0);
}

function renderDiagnosesLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    // Check if it's a multi-attribute container
    if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const keys = Object.keys(dataObj);
        const isMulti = keys.length > 1 && keys.every(k => Array.isArray(dataObj[k]) || (typeof dataObj[k] === 'object' && Object.keys(dataObj[k]).length === 0));
        
        if (isMulti) {
            renderDiagnosesAttributeGroups(dataObj, container, level);
            return;
        }
    }

    const div = document.createElement('div');
    div.className = 'mst-level';
    const titles = ['Órgano:', 'Categoría:', 'Diagnóstico:', 'Atributo:', 'Específico:'];
    div.innerHTML = `<h4>${titles[level] || 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        currentDiagnosesSelection[level] = item;
        currentDiagnosesSelection.splice(level + 1);
        updateDiagnosesPreview();
    };

    if (Array.isArray(dataObj)) {
        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(item);
            };
            grid.appendChild(btn);
        });
    } else {
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = () => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                handleSelection(key);
                renderDiagnosesLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
    }
    container.appendChild(div);
}

function renderDiagnosesAttributeGroups(dataObj, container, level) {
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mst-multi-container';
    
    currentDiagnosesSelection[level] = { __multi: true, values: {} };
    currentDiagnosesSelection.splice(level + 1);

    Object.keys(dataObj).forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mst-attribute-group';
        groupDiv.style.marginBottom = '20px';
        groupDiv.innerHTML = `<h4 style="color: var(--primary); font-size: 0.85rem; margin-bottom: 8px;">${groupKey.toUpperCase()}:</h4><div class="mst-grid"></div>`;
        const grid = groupDiv.querySelector('.mst-grid');
        
        const options = dataObj[groupKey];
        if (Array.isArray(options)) {
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'mst-btn';
                btn.innerText = opt;
                btn.onclick = () => {
                    Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    currentDiagnosesSelection[level].values[groupKey] = opt;
                    updateDiagnosesPreview();
                };
                grid.appendChild(btn);
            });
        }
        mainDiv.appendChild(groupDiv);
    });
    container.appendChild(mainDiv);
}

function updateDiagnosesPreview() {
    const preview = document.getElementById('current-diag-preview');
    const filtered = currentDiagnosesSelection.filter(item => item !== undefined && item !== null).map(item => {
        if (typeof item === 'object' && item.__multi) {
            return Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return item;
    });
    preview.innerText = filtered.join(' > ');
}

function saveDiagnoses() {
    if (currentDiagnosesSelection.length === 0) return;
    
    const formatted = currentDiagnosesSelection.filter(item => item !== undefined && item !== null).map(item => {
        if (typeof item === 'object' && item.__multi) {
            return Object.entries(item.values).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return item;
    });
    
    // Format the selection (e.g., Stomach: Ulcer - Established)
    const organ = formatted[0];
    const category = formatted[1];
    const diag = formatted[2];
    const details = formatted.slice(3).join(' - ');
    
    let text = `${organ}: ${diag}`;
    if (details) text += ` (${details})`;

    const diagArea = document.getElementById('diag-final');
    if (diagArea.value.includes('normal')) diagArea.value = '';
    
    const lines = diagArea.value ? diagArea.value.split('\n') : [];
    if (!lines.includes(text)) {
        diagArea.value = (diagArea.value ? diagArea.value + '\n' : '') + text;
    }
    
    state.metadata.diagFinal = diagArea.value;
    closeDiagnoses();
}

function closeDiagnoses() { document.getElementById('diagnoses-modal').classList.remove('active'); }

// --- Image Tagging Logic ---

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            state.images.push({
                data: event.target.result,
                x1: null, y1: null, // Label position
                x2: null, y2: null, // Target position
                label: 'Sin etiqueta',
                id: Date.now() + Math.random()
            });
            renderGallery();
        };
        reader.readAsDataURL(file);
    });
}

function renderGallery() {
    const list = document.getElementById('gallery-list');
    if(!list) return;
    
    if (state.images.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 50px;">Cargue imágenes para comenzar el mapeo.</p>';
        renderTags();
        return;
    }

    list.innerHTML = '';
    state.images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = `img-tile ${state.selectedImageIndex === index ? 'selected' : ''}`;
        if (state.selectedImageIndex === index) {
            div.style.boxShadow = `0 0 0 2px ${state.tagColors[index % state.tagColors.length]}`;
        }
        
        div.innerHTML = `
            <div class="tile-number" style="background-color: ${state.tagColors[index % state.tagColors.length]}">${index + 1}</div>
            <img src="${img.data}">
            <div class="tile-label">${img.label}</div>
            <button class="remove-img" onclick="removeImage(event, ${index})">&times;</button>
        `;
        div.onclick = () => {
            state.selectedImageIndex = index;
            renderGallery();
        };
        list.appendChild(div);
    });
    renderTags();
}

function assignLabel(text) {
    if(state.selectedImageIndex !== null) {
        state.images[state.selectedImageIndex].label = text;
        renderGallery();
    } else {
        alert("Seleccione una imagen de la galería para etiquetarla.");
    }
}

function assignCustomLabel() {
    const input = document.getElementById('custom-label-text');
    if(state.selectedImageIndex !== null) {
        if(input.value.trim() !== "") {
            state.images[state.selectedImageIndex].label = input.value;
            input.value = "";
            renderGallery();
        }
    } else {
        alert("Seleccione una imagen de la galería para etiquetarla.");
    }
}

function removeImage(e, index) {
    e.stopPropagation();
    state.images.splice(index, 1);
    if(state.selectedImageIndex === index) state.selectedImageIndex = null;
    renderGallery();
}

function handleTagMouseDown(e) {
    if (state.selectedImageIndex === null) {
        alert("Por favor, seleccione primero una imagen de la galería de la izquierda.");
        return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // First click sets the label position
    const img = state.images[state.selectedImageIndex];
    img.x1 = x;
    img.y1 = y;
    img.x2 = x; // Initially same
    img.y2 = y;
    
    isDraggingTag = true;
    renderTags();
}

function handleTagMouseMove(e) {
    if (!isDraggingTag || state.selectedImageIndex === null) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const img = state.images[state.selectedImageIndex];
    img.x2 = x;
    img.y2 = y;
    
    renderTags();
}

function handleTagMouseUp() {
    if (!isDraggingTag) return;
    isDraggingTag = false;

    // Auto select next untagged image
    const nextUntagged = state.images.findIndex((img, idx) => img.x1 === null && idx !== state.selectedImageIndex);
    if(nextUntagged !== -1) {
        state.selectedImageIndex = nextUntagged;
    }

    renderGallery();
}

function renderTags() {
    const svg = document.getElementById('tag-overlay');
    if(!svg) return;
    
    svg.innerHTML = '';
    
    // Define marker for arrowheads
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    state.tagColors.forEach((color, i) => {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", `arrowhead-${i}`);
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
        polygon.setAttribute("fill", color);
        marker.appendChild(polygon);
        defs.appendChild(marker);
    });
    svg.appendChild(defs);

    state.images.forEach((img, index) => {
        if (img.x1 === null) return;

        const color = state.tagColors[index % state.tagColors.length];
        const isSelected = state.selectedImageIndex === index;

        // Draw Line (Leader)
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${img.x1}%`);
        line.setAttribute("y1", `${img.y1}%`);
        line.setAttribute("x2", `${img.x2}%`);
        line.setAttribute("y2", `${img.y2}%`);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", isSelected ? "1.5" : "1");
        line.setAttribute("marker-end", `url(#arrowhead-${index % state.tagColors.length})`);
        if (isSelected) line.setAttribute("stroke-dasharray", "2,1");
        svg.appendChild(line);

        // Draw Circle for Label
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", `${img.x1}%`);
        circle.setAttribute("cy", `${img.y1}%`);
        circle.setAttribute("r", "2.5%");
        circle.setAttribute("fill", color);
        circle.setAttribute("stroke", isSelected ? "white" : "none");
        circle.setAttribute("stroke-width", "0.5");
        svg.appendChild(circle);

        // Draw number
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", `${img.x1}%`);
        text.setAttribute("y", `${img.y1 + 0.8}%`);
        text.setAttribute("class", "tag-text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "10px");
        text.setAttribute("fill", "white");
        text.setAttribute("font-weight", "bold");
        text.textContent = index + 1;
        svg.appendChild(text);
    });
}

function clearAllTags() {
    state.images.forEach(img => {
        img.x1 = null; img.y1 = null;
        img.x2 = null; img.y2 = null;
    });
    renderGallery();
}

function updateFindingsList() {
    const container = document.getElementById('findings-container');
    if (state.findings.length === 0) {
        container.innerHTML = `<p class="placeholder-text">Seleccione un órgano para registrar hallazgos estructurados</p>`;
        return;
    }
    container.innerHTML = '';
    state.findings.forEach((f, idx) => {
        container.innerHTML += `
            <div class="finding-item">
                <div class="body">
                    <span>${f.organ} - <small>${f.location}</small></span>
                    <p>${f.description}</p>
                </div>
                <div class="actions"><button onclick="deleteFinding(${idx})"><i class="fa-solid fa-trash"></i></button></div>
            </div>`;
    });
}

function updateAutoDiagnoses() {
    const diagArea = document.getElementById('diag-final');
    if (state.findings.length === 0) {
        diagArea.value = "Examen endoscópico normal hasta la porción evaluada.";
    } else {
        const order = { 'Exploración': 0, 'Esófago': 1, 'Estómago': 2, 'Duodeno': 3, 'Yeyuno': 4 };
        const sortedFindings = [...state.findings].sort((a, b) => (order[a.organ] ?? 99) - (order[b.organ] ?? 99));
        
        const uniqueOrgans = [...new Set(sortedFindings.map(f => f.organ))];
        let diagText = `Hallazgos patológicos en: ${uniqueOrgans.join(', ')}.\n`;
        sortedFindings.forEach(f => { diagText += `- ${f.organ}: ${f.description}\n`; });
        diagArea.value = diagText;
    }
}

function cleanMstString(str) {
    if (!str) return "";
    
    // Normalize "Tumor / Masa" immediately
    let input = str.replace(/Tumor \/ Masa/gi, 'tumor');
    
    // Split into individual findings (separated by ' - ' in app state)
    let components = input.split(' - ').map(s => s.trim());
    let results = [];

    const labelsToIgnore = [
        'Número', 'Extensión', 'Situación', 'Aspecto', 'Tipo', 
        'Grado', 'Tamaño', 'Sangrado', 'Estigmas de sangrado', 'Estigmas',
        'Circunferencial', 'Obstructivo', 'Pedículo', 'Fondo',
        'Clasificación', 'Atributos Generales', 'morfología', 'distensibilidad',
        'cm desde incisivos', 'Sobrepasable', 'Material de sutura visible', 
        'Material pigmentado', 'Forma', 'Orificio', 'Instrumento', 'Método', 
        'Espécimen', 'Resultado', 'Recuperación del pólipo', 'Precorte', 
        'Forma extracción', 'Material inyectado', 'Volumen', 'Motivo', 
        'Longitud', 'Diámetro', 'Número', 'Lugar(es)', 'Diagnósticos', 'Terapéuticos'
    ];

    for (let i = 0; i < components.length; i++) {
        let comp = components[i];
        let next = components[i + 1] ? components[i + 1].trim() : null;
        
        // Handle "Label: Value" format
        if (comp.includes(':')) {
            let [label, value] = comp.split(':').map(s => s.trim());
            comp = label;
            next = value; // Treat the value as the next item (and we won't skip i++)
        }

        let l = comp.toLowerCase();
        let n = next ? next.toLowerCase() : null;

        // Smart combinations
        if (l === 'sangrado') {
            if (n === 'no') {
                results.push('sin evidencia de sangrado activo');
                if (!components[i].includes(':')) i++; // Skip "no" if it was a separate item
            } else if (n) {
                results.push('con sangrado ' + n);
                if (!components[i].includes(':')) i++;
            } else {
                results.push('sangrado');
            }
        } else if (l === 'estigmas de sangrado' || l === 'estigmas') {
            if (n === 'no') {
                results.push('sin estigmas de sangrado reciente');
                if (!components[i].includes(':')) i++;
            } else if (n) {
                results.push('con estigmas de sangrado ' + n);
                if (!components[i].includes(':')) i++;
            } else {
                results.push('estigmas de sangrado');
            }
        } else if (l === 'circunferencial') {
            if (n === 'si') {
                results.push('circunferencial');
                if (!components[i].includes(':')) i++;
            }
        } else if (l === 'obstructivo') {
            if (n === 'si') {
                results.push('obstructivo');
                if (!components[i].includes(':')) i++;
            }
        } else if (labelsToIgnore.includes(comp)) {
            // Ignore the label if it's just a structural word
            continue;
        } else if (l === 'no') {
            results.push('ausente');
        } else if (l === 'si') {
            results.push('presente');
        } else {
            results.push(l);
        }
    }

    // Join and final cleanup
    let clean = results.filter(r => r && r !== 'si' && r !== 'no').join(', ');
    
    // Global refinements
    clean = clean.replace(/\(especificar\)/gi, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
}

function formatClinicalNarrative(organ, findings) {
    if (findings.length === 0) {
        switch (organ) {
            case 'Esófago':
                return "Esófago de morfología, calibre y distensibilidad normales. Mucosa de aspecto sonrosado, lisa y brillante, con trama vascular conservada. Unión esofagogástrica coincidente con la pinza diafragmática, sin evidencia de lesiones ni estigmas de sangrado.";
            case 'Estómago':
                return "Estómago con lago gástrico de contenido claro y cantidad habitual. Morfología y distensibilidad conservadas a la insuflación. Pliegues gástricos de trayecto y grosor normal. Mucosa de fondo, cuerpo y antro de características endoscópicas normales. Píloro céntrico, circular y franqueable.";
            case 'Duodeno':
                return "Bulbo duodenal y segunda porción duodenal de morfología normal. Mucosa íntegra, de aspecto aterciopelado sin evidencia de soluciones de continuidad ni lesiones protruyentes.";
            case 'Yeyuno':
                return "Segmentos de yeyuno explorados sin evidencia de alteraciones. Morfología, distensibilidad y mucosa de características endoscópicas normales.";
            case 'Exploración':
                return "Procedimiento realizado sin complicaciones técnicas. Extensión del examen satisfactoria según el objetivo clínico. Preparación de la mucosa adecuada que permite una valoración diagnóstica óptima.";
            default:
                return "De características endoscópicas normales.";
        }
    }

    // Contextual phrasing for findings
    let intro = "";
    switch (organ) {
        case 'Esófago': intro = "Esófago con distensibilidad conservada, sin embargo, "; break;
        case 'Estómago': intro = "Estómago con lago mucoso de características normales. Durante la exploración "; break;
        case 'Duodeno': intro = "Duodeno explorado bajo visión directa; "; break;
        case 'Yeyuno': intro = "Yeyuno explorado mediante visión luminal; "; break;
        case 'Exploración': intro = "En cuanto a los límites y condiciones del estudio, "; break;
    }

    const findingSentences = findings.map(f => {
        const loc = f.location;
        const desc = cleanMstString(f.description);
        
        if (!desc) return null;

        if (loc === 'General' || loc === 'Totalidad del órgano' || loc === 'Totalidad del esófago' || loc === 'Totalidad del estómago') {
            return `se evidencia ${desc}`;
        }
        return `a nivel de ${loc} se aprecia ${desc}`;
    }).filter(s => s !== null);

    if (findingSentences.length === 0) return formatClinicalNarrative(organ, []);

    let combined = intro + findingSentences.join("; adicionalmente ") + ".";
    
    // Final polish: remove double spaces and fix capitalization
    combined = combined.replace(/\s+/g, ' ').replace(/\. \./g, '.');
    return combined.charAt(0).toUpperCase() + combined.slice(1);
}

function formatProceduresNarrative(procedimientos) {
    if (!procedimientos || procedimientos.length === 0) return "";
    
    const sentences = procedimientos.map(p => {
        let fullDesc = p.description;
        let organLoc = "";
        
        if (fullDesc.includes(': ')) {
            const parts = fullDesc.split(': ');
            organLoc = parts[0].trim();
            fullDesc = parts.slice(1).join(': ').trim();
        }
        
        // Remove structural labels and internal separators
        let items = fullDesc.split(' - ').map(s => s.trim()).filter(s => {
            const sl = s.toLowerCase();
            return sl !== 'diagnósticos' && sl !== 'terapéuticos';
        });

        if (items.length === 0) return null;

        let procName = items[0];
        let attributes = items.slice(1);
        
        let subLoc = "";
        let details = [];
        let result = "";

        attributes.forEach(attr => {
            if (attr.includes(':')) {
                let [label, value] = attr.split(':').map(s => s.trim());
                let l = label.toLowerCase();
                let v = value.toLowerCase();
                
                if (v === '' || v === '(especificar)') return; // Skip empty/placeholder values

                if (l === 'lugar(es)') subLoc = value;
                else if (l === 'resultado') result = value;
                else if (l === 'espécimen') details.push('para ' + v);
                else if (l === 'método' || l === 'instrumento' || l === 'tipo' || l === 'colorante') details.push(v);
                else if (v !== 'no' && v !== 'si') details.push(`${l} ${v}`);
                else if (v === 'si') details.push(l);
            } else {
                let v = attr.trim();
                let vL = v.toLowerCase();
                if (v && vL !== '(especificar)' && vL !== 'sí' && vL !== 'no') details.push(vL);
            }
        });

        let sentence = "";
        const nameL = procName.toLowerCase();
        if (nameL.includes('gastrostomía')) {
            sentence = "se colocó sonda de gastrostomía percutánea";
        } else if (nameL.includes('biopsia')) {
            sentence = "se realizó biopsia";
        } else if (nameL.includes('polipectomia')) {
            sentence = "se realizó polipectomía";
        } else if (nameL.includes('dilatación')) {
            sentence = "se realizó dilatación";
        } else if (nameL.includes('ligadura')) {
            sentence = "se realizó ligadura";
        } else if (nameL.includes('inyección')) {
            sentence = "se realizó inyección";
        } else {
            sentence = `se realizó ${nameL}`;
        }

        if (subLoc && subLoc.toLowerCase() !== '(especificar)') {
            sentence += ` en ${subLoc}`;
        }
        
        let validDetails = details.filter(d => {
            if (!d || d.trim().length === 0) return false;
            // Deduplicate: if the detail is already in the sentence (e.g. 'percutánea'), skip it
            if (sentence.toLowerCase().includes(d.toLowerCase())) return false;
            return true;
        });

        // Better wording for common phrases
        validDetails = validDetails.map(d => {
            if (d.startsWith('forma extracción ')) return d.replace('forma extracción ', 'de extracción ');
            return d;
        });

        if (validDetails.length > 0) {
            sentence += ` con ${validDetails.join(' ')}`;
        }

        if (result && result.toLowerCase() !== '(especificar)') {
            let rL = result.toLowerCase();
            if (rL.includes('satisfactorio') || rL.includes('satisfactoria')) {
                sentence += ` de manera satisfactoria`;
            } else {
                sentence += ` con resultado ${rL}`;
            }
        }

        if (organLoc && organLoc !== 'General') {
            return `en ${organLoc.toLowerCase()} ${sentence}`;
        }
        return sentence;
    }).filter(s => s !== null);

    if (sentences.length === 0) return "";
    
    let narrative = "";
    if (sentences.length === 1) {
        narrative = sentences[0];
    } else if (sentences.length === 2) {
        narrative = sentences.join(" y ");
    } else {
        const last = sentences.pop();
        narrative = sentences.join(", ") + " y " + last;
    }
    
    let combined = "Durante la endoscopia " + narrative + ".";
    combined = combined.replace(/\s+/g, ' ').replace(/\. \./g, '.').replace(/ ,/g, ',');
    return combined.charAt(0).toUpperCase() + combined.slice(1);
}

function generateReport(skipSave = false) {
    // Only auto-suggest if the field is empty
    const diagArea = document.getElementById('diag-final');
    if (!diagArea.value || diagArea.value.trim() === "" || diagArea.value.includes('normal')) {
        updateAutoDiagnoses();
    }
    const modal = document.getElementById('report-modal');
    const body = document.getElementById('report-preview-body');

    let findingsHtml = '';
    if (state.findings.length === 0 && !state.metadata.diagFinal) {
        findingsHtml = '<p>Examen endoscópico dentro de los límites de la normalidad.</p>';
    } else {
        const byOrgan = { 'Exploración': [], 'Esófago': [], 'Estómago': [], 'Duodeno': [], 'Yeyuno': [] };
        state.findings.forEach(f => { if(byOrgan[f.organ]) byOrgan[f.organ].push(f); });
        
        ['Exploración', 'Esófago', 'Estómago', 'Duodeno', 'Yeyuno'].forEach(org => {
            const organFindings = byOrgan[org];
            if (organFindings && (organFindings.length > 0 || org !== 'Yeyuno')) {
                const narrative = formatClinicalNarrative(org, organFindings);
                findingsHtml += `<div style="margin-bottom: 15px;">
                    <strong style="color: #000; text-transform: uppercase; font-size: 0.85rem; display: block; margin-bottom: 4px; border-left: 3px solid #333; padding-left: 8px;">${org}:</strong> 
                    <div style="color: #333; text-align: justify; padding-left: 11px;">${narrative}</div>
                </div>`;
            }
        });
    }

    const html = `
        <div class="report-document" style="padding: 50px; color: #1a1a1a; font-family: 'Inter', sans-serif; line-height: 1.5;">
            <!-- Header Structure -->
            <div style="display: flex; align-items: center; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 30px;">
                ${state.settings.logo ? `<div style="width: 100px; padding-right: 20px;"><img src="${state.settings.logo}" style="width: 100%; max-height: 100px; object-fit: contain;"></div>` : ''}
                <div style="flex: 1; text-align: ${state.settings.logo ? 'left' : 'center'};">
                    <h1 style="margin: 0; font-size: 1.8rem; letter-spacing: -0.5px; color: #000;">${state.settings.hospital || "HOSPITAL GENERAL"}</h1>
                    <p style="margin: 4px 0 0 0; color: #555; font-size: 1rem; font-weight: 500;">${state.settings.location || "SERVICIO DE GASTROENTEROLOGÍA Y ENDOSCOPIA"}</p>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 35px;">
                <h2 style="margin: 0; font-size: 1.4rem; text-transform: uppercase; border-bottom: 1px solid #eee; display: inline-block; padding: 0 40px 5px 40px;">Informe Médico de Endoscopia</h2>
                <div style="font-size: 0.9rem; color: #666; margin-top: 8px;">Fecha de emisión: ${formatDate()}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 0.95rem;">
                <tr style="background: #f9fafb; border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold; width: 120px;">PACIENTE:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.nombre || 'No registro'}</td>
                    <td style="padding: 10px; font-weight: bold; width: 100px;">DNI:</td>
                    <td style="padding: 10px;">${state.patient.dni || 'No registro'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">F. NACIMIENTO:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.fnacimiento ? formatDate(state.patient.fnacimiento) : '-'} (${state.patient.edad ? state.patient.edad + ' años' : '-'})</td>
                    <td style="padding: 10px; font-weight: bold;">SEXO / PROC:</td>
                    <td style="padding: 10px;">${state.patient.sexo || '-'} / ${state.patient.municipio ? state.patient.municipio + ', ' : ''}${state.patient.departamento || '-'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">MÉDICO REF:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.clinical.referente || 'No especificado'}</td>
                    <td style="padding: 10px; font-weight: bold;">INDICACIÓN:</td>
                    <td style="padding: 10px;">${state.metadata.indicacion || 'Escrutinio'}</td>
                </tr>
            </table>

            <div style="margin-bottom: 30px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">HALLAZGOS MACROSCÓPICOS</div>
                <div style="padding-left: 5px;">${findingsHtml}</div>
            </div>

            ${state.procedimientos.length > 0 ? `
            <div style="margin-bottom: 30px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">PROCEDIMIENTOS REALIZADOS</div>
                <div style="color: #333; text-align: justify; padding-left: 11px;">${formatProceduresNarrative(state.procedimientos)}</div>
            </div>
            ` : ''}

            <div style="margin-bottom: 35px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">CONCLUSIONES Y DIAGNÓSTICO</div>
                <div style="padding: 10px; background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; border-left: 4px solid #eab308; white-space: pre-wrap; font-weight: 500;">${document.getElementById('diag-final').value}</div>
            </div>

            <!-- Photos Section -->
            ${state.images.length > 0 ? `
            <div style="margin-bottom: 40px; page-break-before: auto;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">DOCUMENTACIÓN FOTOGRÁFICA Y MAPEEO</div>
                
                <!-- Central Diagram Mapping -->
                <div style="display: flex; gap: 30px; align-items: flex-start; margin-bottom: 30px; background: #fcfcfc; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <div style="position: relative; width: 300px; background: white; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                        <img src="gi_diagram.png" style="width: 100%; display: block;">
                        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                            <defs>
                                ${state.tagColors.map((color, i) => `
                                    <marker id="pdf-arrow-${i}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="${color}" />
                                    </marker>
                                `).join('')}
                            </defs>
                            ${state.images.map((img, i) => img.x1 !== null ? `
                                <line x1="${img.x1}%" y1="${img.y1}%" x2="${img.x2}%" y2="${img.y2}%" stroke="${state.tagColors[i % state.tagColors.length]}" stroke-width="1" marker-end="url(#pdf-arrow-${i % state.tagColors.length})" />
                                <circle cx="${img.x1}%" cy="${img.y1}%" r="3%" fill="${state.tagColors[i % state.tagColors.length]}" />
                                <text x="${img.x1}%" y="${img.y1 + 1}%" font-size="8" text-anchor="middle" font-weight="bold" fill="white">${i + 1}</text>
                            ` : '').join('')}
                        </svg>
                        <div style="text-align: center; font-size: 0.7rem; color: #888; margin-top: 5px;">Esquema de Localización de Hallazgos</div>
                    </div>
                    
                    <div style="flex: 1; font-size: 0.85rem;">
                        <p style="margin-top: 0; font-weight: bold; color: #333;">Leyenda de Mapeo:</p>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            ${state.images.filter(img => img.x1 !== null).map((img, i) => `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="background: ${state.tagColors[i % state.tagColors.length]}; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${i + 1}</span>
                                    <span style="color: #555;">${img.label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    ${state.images.map((img, i) => `
                        <div style="text-align: center; position: relative;">
                            <img src="${img.data}" style="width: 100%; height: 130px; object-fit: cover; border: 1px solid #eee; border-radius: 4px;">
                            <div style="font-size: 0.8rem; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <span style="background: ${state.tagColors[i % state.tagColors.length]}; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold;">${i + 1}</span>
                                <span style="color: #333;"><strong>Fig ${i + 1}:</strong> ${img.label}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div style="margin-bottom: 40px;">
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">PLAN Y RECOMENDACIONES</div>
                <div style="padding-left: 5px; white-space: pre-wrap;">${state.plan || 'No se registran recomendaciones adicionales en esta fecha.'}</div>
            </div>

            <div style="margin-top: 80px; display: flex; justify-content: flex-end;">
                <div style="text-align: center; width: 300px; border-top: 1px solid #000; padding-top: 10px;">
                    <div style="font-weight: 800; font-size: 1.1rem; color: #000;">${state.settings.physician || state.currentUser.username}</div>
                    <div style="font-size: 0.9rem; color: #444;">${state.settings.specialty || "Médico Gastroenterólogo"}</div>
                    <div style="font-size: 0.8rem; color: #777; margin-top: 2px;">Sello y Firma Autorizada</div>
                </div>
            </div>
            
            <div style="margin-top: 40px; font-size: 0.75rem; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                Generado por Sistema de Reportes EndoReport - Documentación Médica Digital
            </div>
        </div>`;

    body.innerHTML = html;
    modal.classList.add('active');

    if(!skipSave) saveToHistory();
}

function closeReport() { document.getElementById('report-modal').classList.remove('active'); }

function printReport() {
    const reportContent = document.getElementById('report-preview-body').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Imprimir Reporte</title>
        <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            h1 { border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            .report-section { margin-bottom: 20px; }
            .report-section h4 { text-decoration: underline; margin-bottom: 10px; background: #f8f9fa; padding: 5px;}
            .report-row { display: flex; margin-bottom: 5px; }
            .report-label { font-weight: bold; min-width: 200px; }
            @media print { body { margin: 0; padding: 0; } }
        </style></head>
        <body>${reportContent}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}

// --- History & Database Logic ---

async function saveToHistory() {
    if(!state.patient.nombre) {
        alert("Por favor, ingrese al menos el nombre del paciente para guardar.");
        return;
    }

    const token = sessionStorage.getItem('endo_token');
    if (!token) {
        alert("Debe iniciar sesión para guardar estudios.");
        return;
    }

    const record = {
        currentStudyId: state.currentStudyId,
        patient: { ...state.patient },
        clinical: { ...state.clinical },
        metadata: { ...state.metadata },
        quality: { ...state.quality },
        diagnoses: document.getElementById('diag-final')?.value || '',
        plan: state.plan,
        findings: [ ...state.findings ],
        procedimientos: [ ...state.procedimientos ],
        images: [ ...state.images ]
    };

    try {
        const res = await fetch('http://localhost:3000/studies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(record)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            state.currentStudyId = data.studyId;
            console.log(`Estudio guardado. Versión: ${data.version}`);
            renderHistory();
            alert("Estudio guardado correctamente.");
        } else {
            alert("Error al guardar: " + (data.error || 'Server error'));
        }
    } catch (e) {
        console.error("Error saving study:", e);
        alert("Error de conexión al guardar.");
    }
}

async function renderHistory(filter = "") {
    const body = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty-state');
    if(!body) return;

    const token = sessionStorage.getItem('endo_token');
    if (!token) return;

    try {
        const res = await fetch(`http://localhost:3000/studies?search=${encodeURIComponent(filter)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const records = await res.json();

        if (records.length === 0) {
            body.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        body.innerHTML = records.map((r) => {
            const dateStr = new Date(r.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).split(',')[0];
            return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px; font-size: 0.85rem;">${dateStr}</td>
                <td style="padding: 12px; font-weight: 500;">${r.patient.nombre || 'Sin nombre'}</td>
                <td style="padding: 12px; font-size: 0.85rem; color: var(--text-muted);">${r.patient.dni || '-'}</td>
                <td style="padding: 12px; font-size: 0.85rem;">${r.metadata.indicacion || '-'}</td>
                <td style="padding: 12px; font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.diagnoses || '-'}</td>
                <td style="padding: 12px; text-align: center; white-space: nowrap;">
                    <button class="btn btn-icon" title="Ver Reporte" onclick="viewHistoryDetail('${r.id}')" style="color: var(--success); margin-right: 5px;"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-icon ${state.currentUser?.role !== 'admin' ? 'disabled' : ''}" title="${state.currentUser?.role !== 'admin' ? 'Solo administrador puede editar' : 'Cargar para Editar'}" onclick="loadFromHistory('${r.id}')" style="color: var(--primary); margin-right: 5px; opacity: ${state.currentUser?.role !== 'admin' ? '0.5' : '1'}; cursor: ${state.currentUser?.role !== 'admin' ? 'not-allowed' : 'pointer'};"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-icon ${state.currentUser?.role !== 'admin' ? 'disabled' : ''}" title="${state.currentUser?.role !== 'admin' ? 'Solo administrador puede eliminar' : 'Eliminar'}" onclick="deleteFromHistory('${r.id}')" style="color: var(--danger); opacity: ${state.currentUser?.role !== 'admin' ? '0.5' : '1'}; cursor: ${state.currentUser?.role !== 'admin' ? 'not-allowed' : 'pointer'};"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
    } catch (e) {
        console.error("Error fetching history:", e);
    }
}

function viewHistoryDetail(id) {
    try {
        loadFromHistory(id, true).then(() => {
            setTimeout(() => {
                generateReport(true); // Show report preview after a tiny delay
            }, 50);
        });
    } catch (e) {
        console.error("Error loading history:", e);
    }
}


async function loadFromHistory(id, silent = false) {
    const token = sessionStorage.getItem('endo_token');
    if (!token) return;

    if(!silent) {
        if(state.currentUser?.role !== 'admin') {
            alert("Solo los administradores pueden editar estudios guardados.");
            return;
        }
        if(!confirm("¿Desea cargar este estudio para edición? Se reemplazarán los datos actuales.")) return;
    }

    try {
        const res = await fetch(`http://localhost:3000/studies/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            alert("No se encontró el registro seleccionado (o error de servidor).");
            return;
        }
        
        const record = await res.json();

        // 1. Restore State
        state.currentStudyId = record.currentStudyId;
        state.patient = JSON.parse(JSON.stringify(record.patient || {}));
        state.clinical = JSON.parse(JSON.stringify(record.clinical || {}));
        state.metadata = JSON.parse(JSON.stringify(record.metadata || {}));
        state.quality = JSON.parse(JSON.stringify(record.quality || {}));
        state.findings = JSON.parse(JSON.stringify(record.findings || []));
        state.procedimientos = JSON.parse(JSON.stringify(record.procedimientos || []));
        state.images = JSON.parse(JSON.stringify(record.images || []));
        state.plan = record.plan || '';

        // 2. Sync UI Elements
        const fieldMap = {
            'paciente-nombre': state.patient.nombre,
            'paciente-dni': state.patient.dni,
            'paciente-fnacimiento': state.patient.fnacimiento,
            'paciente-sexo': state.patient.sexo,
            'paciente-antecedentes': state.patient.antecedentes,
            'clinico-referente': state.clinical.referente,
            'clinico-asa': state.clinical.asa,
            'clinico-anticoagulante': state.clinical.anticoagulante,
            'clinico-preparacion': state.clinical.preparacion,
            'indicacion': state.metadata.indicacion,
            'sedacion': state.metadata.sedacion,
            'instrumento': state.metadata.instrumento,
            'extension': state.metadata.extension,
            'calidad-consentimiento': state.quality.consentimiento,
            'calidad-fotos': state.quality.fotos,
            'calidad-completa': state.quality.completa,
            'calidad-tiempo': state.quality.tiempo,
            'diag-final': record.diagnoses || '',
            'plan': state.plan
        };

        Object.keys(fieldMap).forEach(key => {
            const el = document.getElementById(key);
            if(el) el.value = fieldMap[key] || '';
        });

        // Special handling for geography
        const deptoSelect = document.getElementById('paciente-departamento');
        if(deptoSelect && state.patient.departamento) {
            deptoSelect.value = state.patient.departamento;
            deptoSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                const muniSelect = document.getElementById('paciente-municipio');
                if(muniSelect) muniSelect.value = state.patient.municipio || '';
            }, 50);
        }

        // 3. Update Visuals
        updateTopbar();
        updateFindingsList();
        updateProcedimientosList();
        renderGallery();
        
        if(!silent) switchMainView('new');

    } catch (e) {
        console.error("Critical error loading history:", e);
        if(!silent) alert("Hubo un error al sincronizar los datos. Algunos campos podrían no haberse cargado correctamente.");
    }
}

function resetForm() {
    if(!confirm("¿Desea limpiar el formulario para un nuevo estudio? Se perderán los datos no guardados.")) return;
    
    state.currentStudyId = null;
    state.patient = { nombre:'', dni:'', fnacimiento:'', sexo:'', departamento:'', municipio:'', antecedentes:'', edad:'' };
    state.clinical = { referente: '', asa: 'ASA I (Normal, sano)', anticoagulante: 'No', preparacion: 'Adecuado (Ayuno > 8h)' };
    state.metadata = { indicacion: '', sedacion: 'Sedación Consciente', instrumento: 'Olympus', extension: 'Duodeno D2' };
    state.quality = { consentimiento: 'Sí, obtenido y firmado', fotos: 'Estándar (≥ 10 fotos)', completa: 'Sí (incluye retrovisión)', tiempo: '≥ 7 minutos' };
    state.findings = [];
    state.procedimientos = [];
    state.images = [];
    state.plan = '';
    state.selectedImageIndex = null;

    // Reset UI
    document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
        if(!el.id.startsWith('login-')) el.value = (el.tagName === 'SELECT') ? el.options[0]?.value || '' : '';
    });
    
    // Re-set defaults for selects
    ['asa', 'anticoagulante', 'preparacion'].forEach(id => {
        const el = document.getElementById(`clinico-${id}`);
        if(el) el.value = state.clinical[id];
    });
    const qualityDefaults = { consentimiento: 'Sí, obtenido y firmado', fotos: 'Estándar (≥ 10 fotos)', completa: 'Sí (incluye retrovisión)', tiempo: '≥ 7 minutos' };
    Object.keys(qualityDefaults).forEach(id => {
        const el = document.getElementById(`calidad-${id}`);
        if(el) el.value = qualityDefaults[id];
    });

    updateTopbar();
    updateFindingsList();
    updateProcedimientosList();
    renderGallery();
    switchMainView('new');
}

function filterHistory(val) { renderHistory(val); }

async function deleteFromHistory(id) {
    const token = sessionStorage.getItem('endo_token');
    if (!token) return;

    if(state.currentUser?.role !== 'admin') {
        alert("Solo los administradores pueden eliminar estudios.");
        return;
    }
    if(confirm("¿Eliminar este registro de forma permanente?")) {
        try {
            const res = await fetch(`http://localhost:3000/studies/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                renderHistory();
            } else {
                alert("Error al eliminar el estudio.");
            }
        } catch (e) {
            console.error("Error deleting study:", e);
        }
    }
}

function clearHistory() {
    alert("Por seguridad, la eliminación masiva (borrar todo) está deshabilitada. Puede eliminar los estudios individualmente si tiene permisos de administrador.");
}

function exportToCSV() {
    const token = sessionStorage.getItem('endo_token');
    if (!token) return;

    if(state.currentUser?.role !== 'admin') {
        alert("Solo los administradores pueden exportar el historial.");
        return;
    }

    fetch('http://localhost:3000/studies/export/csv', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Error en servidor al exportar CSV");
        return res.text();
    })
    .then(csv => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Endoscopia_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    })
    .catch(e => {
        console.error("Error exportando CSV:", e);
        alert("Hubo un error al exportar como Excel.");
    });
}
