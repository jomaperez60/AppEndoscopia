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
let currentMstSelection = [];
var currentIndicationsSelection = [];

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
            if (tab.dataset.target === 'diagnoses') updateAutoDiagnoses();
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
    if (state.currentUser) {
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

function handleLogin() {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const foundUser = state.users.find(u => u.username === user && u.password === pass);

    if (foundUser) {
        state.currentUser = foundUser;
        sessionStorage.setItem('endo_current_user', JSON.stringify(foundUser));
        errorEl.style.display = 'none';
        checkAuth();
        // Clear inputs
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    } else {
        errorEl.style.display = 'block';
    }
}

function handleLogout() {
    state.currentUser = null;
    sessionStorage.removeItem('endo_current_user');
    checkAuth();
    switchMainView('new');
}

function renderUsers() {
    const body = document.getElementById('users-table-body');
    if (!body) return;

    body.innerHTML = state.users.map(u => `
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
                ` : '<span style="font-size: 0.7rem; color: var(--text-muted);">Sustema</span>'}
            </td>
        </tr>
    `).join('');
}

function openUserModal() { document.getElementById('user-modal').classList.add('active'); }
function closeUserModal() { document.getElementById('user-modal').classList.remove('active'); }

function saveNewUser() {
    const user = document.getElementById('new-username').value.trim();
    const pass = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    if (!user || !pass) { alert("Por favor, complete todos los campos."); return; }
    if (state.users.some(u => u.username === user)) { alert("El nombre de usuario ya existe."); return; }

    state.users.push({ username: user, password: pass, role: role });
    localStorage.setItem('endo_users', JSON.stringify(state.users));
    closeUserModal();
    renderUsers();
}

function deleteUser(username) {
    if (confirm(`¿Está seguro de eliminar al usuario ${username}?`)) {
        state.users = state.users.filter(u => u.username !== username);
        localStorage.setItem('endo_users', JSON.stringify(state.users));
        renderUsers();
    }
}

let userToPasswordChange = '';
function openPasswordModal(username) {
    // Only admin can change others' passwords, or a user can change their own
    if (state.currentUser.role !== 'admin' && state.currentUser.username !== username) return;
    userToPasswordChange = username;
    document.getElementById('password-modal').classList.add('active');
}

function handleChangePassword() {
    const newPass = document.getElementById('change-password-new').value;
    if (!newPass) return;

    const userIdx = state.users.findIndex(u => u.username === userToPasswordChange);
    if (userIdx !== -1) {
        state.users[userIdx].password = newPass;
        localStorage.setItem('endo_users', JSON.stringify(state.users));
        
        // If changing current user's password, update session too
        if (state.currentUser.username === userToPasswordChange) {
            state.currentUser.password = newPass;
            sessionStorage.setItem('endo_current_user', JSON.stringify(state.currentUser));
        }
        
        alert("Contraseña actualizada exitosamente.");
        document.getElementById('password-modal').classList.remove('active');
        renderUsers();
    }
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
    currentMstSelection = [];
    document.getElementById('mst-title').innerText = `Hallazgos en ${organ}`;
    renderMstLevel(mstTree[organ], document.getElementById('mst-body'), 0);
    document.getElementById('mst-modal').classList.add('active');
}

function renderMstLevel(dataObj, container, level) {
    if (!dataObj) return;

    const existingLevels = Array.from(container.children);
    existingLevels.forEach((el, idx) => { if (idx >= level) el.remove(); });

    if (Array.isArray(dataObj)) {
        const div = document.createElement('div');
        div.className = 'mst-level';
        div.innerHTML = `<h4>Especificación:</h4><div class="mst-grid"></div>`;
        const grid = div.querySelector('.mst-grid');
        
        if (dataObj.length === 0) {
             currentMstSelection.splice(level);
             return;
        }

        dataObj.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = item;
            btn.onclick = (e) => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                currentMstSelection[level] = item;
                currentMstSelection.splice(level + 1);
            };
            grid.appendChild(btn);
        });
        container.appendChild(div);
    } else if (typeof dataObj === 'object') {
        const div = document.createElement('div');
        div.className = 'mst-level';
        div.innerHTML = `<h4>Categoría MST:</h4><div class="mst-grid"></div>`;
        const grid = div.querySelector('.mst-grid');
        
        Object.keys(dataObj).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'mst-btn';
            btn.innerText = key;
            btn.onclick = (e) => {
                Array.from(grid.children).forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                currentMstSelection[level] = key;
                currentMstSelection.splice(level + 1);
                renderMstLevel(dataObj[key], container, level + 1);
            };
            grid.appendChild(btn);
        });
        container.appendChild(div);
    }
}

function saveFinding() {
    if (currentMstSelection.length === 0) { alert("Debe seleccionar al menos un descriptor clínico"); return; }
    const findingText = currentMstSelection.join(' - ');
    state.findings.push({ organ: currentOrgan, description: findingText });
    closeMstModal();
    updateFindingsList();
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

    const div = document.createElement('div');
    div.className = 'mst-level';
    div.innerHTML = `<h4>${level === 0 ? 'Categoría:' : 'Especificación:'}</h4><div class="mst-grid"></div>`;
    const grid = div.querySelector('.mst-grid');

    const handleSelection = (item) => {
        // Remove old specification inputs if any
        const oldSpec = div.querySelector('.spec-container');
        if (oldSpec) oldSpec.remove();

        currentIndicationsSelection[level] = item;
        currentIndicationsSelection.splice(level + 1);
        
        if (item.toLowerCase().includes('(especificar)')) {
            const specDiv = document.createElement('div');
            specDiv.className = 'spec-container';
            specDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;';
            specDiv.innerHTML = `
                <label style="display:block; margin-bottom: 6px; font-size: 0.8rem; color: #64748b; font-weight: 600;">DETALLE ADICIONAL:</label>
                <input type="text" placeholder="Escriba el detalle aquí..." 
                       style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;"
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

function saveIndication() {
    if (currentIndicationsSelection.length === 0) {
        console.warn("No selection made in Indications modal.");
        return;
    }
    
    const filtered = currentIndicationsSelection.filter(item => item && item.trim().length > 0);
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
                <div class="body"><span>${f.organ}</span><p>${f.description}</p></div>
                <div class="actions"><button onclick="deleteFinding(${idx})"><i class="fa-solid fa-trash"></i></button></div>
            </div>`;
    });
}

function updateAutoDiagnoses() {
    const diagArea = document.getElementById('diag-final');
    if (state.findings.length === 0) {
        diagArea.value = "Examen endoscópico normal hasta la porción evaluada.";
    } else {
        const order = { 'Esófago': 1, 'Estómago': 2, 'Duodeno': 3 };
        const sortedFindings = [...state.findings].sort((a, b) => order[a.organ] - order[b.organ]);
        
        const uniqueOrgans = [...new Set(sortedFindings.map(f => f.organ))];
        let diagText = `Hallazgos patológicos en: ${uniqueOrgans.join(', ')}.\n`;
        sortedFindings.forEach(f => { diagText += `- ${f.organ}: ${f.description}\n`; });
        diagArea.value = diagText;
    }
}

function generateReport(skipSave = false) {
    updateAutoDiagnoses();
    const modal = document.getElementById('report-modal');
    const body = document.getElementById('report-preview-body');

    let findingsHtml = '';
    if (state.findings.length === 0) {
        findingsHtml = '<p>Normal.</p>';
    } else {
        const byOrgan = { 'Esófago': [], 'Estómago': [], 'Duodeno': [] };
        state.findings.forEach(f => { if(byOrgan[f.organ]) byOrgan[f.organ].push(f.description); });
        
        ['Esófago', 'Estómago', 'Duodeno'].forEach(org => {
            if (byOrgan[org].length > 0) {
                findingsHtml += `<div style="margin-bottom: 12px;"><strong>${org}:</strong> <span style="color: #333;">${byOrgan[org].join(', ')}.</span></div>`;
            } else {
                findingsHtml += `<div style="margin-bottom: 12px;"><strong>${org}:</strong> Normal.</div>`;
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

function saveToHistory() {
    if(!state.patient.nombre) {
        alert("Por favor, ingrese al menos el nombre del paciente para guardar.");
        return;
    }

    const record = {
        id: state.currentStudyId || Date.now(),
        date: formatDate(),
        dateTime: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
        patient: { ...state.patient },
        clinical: { ...state.clinical },
        metadata: { ...state.metadata },
        quality: { ...state.quality },
        diagnoses: document.getElementById('diag-final').value,
        plan: state.plan,
        findings: [ ...state.findings ],
        images: [ ...state.images ] // Persist images too!
    };

    const existingIdx = state.history.findIndex(r => r.id === record.id);
    if (existingIdx !== -1) {
        state.history[existingIdx] = record;
        console.log("Estudio actualizado en el historial.");
    } else {
        state.history.unshift(record);
        state.currentStudyId = record.id;
        console.log("Nuevo estudio guardado en el historial.");
    }

    localStorage.setItem('endo_history', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory(filter = "") {
    const body = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty-state');
    if(!body) return;

    const filtered = state.history.filter(r => 
        (r.patient.nombre && r.patient.nombre.toLowerCase().includes(filter.toLowerCase())) || 
        (r.patient.dni && r.patient.dni.includes(filter))
    );

    if (filtered.length === 0) {
        body.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    body.innerHTML = filtered.map((r, index) => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 12px; font-size: 0.85rem;">${r.date}</td>
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
    `).join('');
}

function viewHistoryDetail(id) {
    try {
        loadFromHistory(id, true); // Load silently (full sync)
        setTimeout(() => {
            generateReport(true); // Show report preview after a tiny delay
        }, 50);
    } catch (e) {
        console.error("Error loading history:", e);
    }
}

function loadFromHistory(id, silent = false) {
    const record = state.history.find(r => String(r.id) === String(id));
    if(!record) {
        alert("No se encontró el registro seleccionado.");
        return;
    }

    if(!silent) {
        if(state.currentUser.role !== 'admin') {
            alert("Solo los administradores pueden editar estudios guardados.");
            return;
        }
        if(!confirm("¿Desea cargar este estudio para edición? Se reemplazarán los datos actuales.")) return;
    }

    try {
        // 1. Restore State (Object shallow copies)
        state.patient = Object.assign({}, record.patient);
        state.clinical = Object.assign({}, record.clinical);
        state.metadata = Object.assign({}, record.metadata);
        state.quality = Object.assign({}, record.quality);
        state.findings = Array.from(record.findings || []);
        state.images = Array.from(record.images || []);
        state.plan = record.plan || '';

        // 2. Sync DOM Elements
        // Simple inputs
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
            'diag-final': record.diagnoses || ''
        };

        Object.keys(fieldMap).forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = fieldMap[id] || '';
        });

        // 3. Special handling for address (if it exists)
        if (state.patient.departamento) {
            const deptoEl = document.getElementById('paciente-departamento');
            if (deptoEl) {
                deptoEl.value = state.patient.departamento;
                deptoEl.dispatchEvent(new Event('change')); // Trigger municipio filter
                setTimeout(() => {
                    const muniEl = document.getElementById('paciente-municipio');
                    if (muniEl) muniEl.value = state.patient.municipio;
                }, 50);
            }
        }

        // 4. Render dependent UI
        renderGallery();
        updateFindingsList();
        updateTopbar();

        if(!silent) switchMainView('new');

    } catch (e) {
        console.error("Error syncing UI from record:", e);
    }
}

function loadFromHistory(id, silent = false) {
    const record = state.history.find(r => String(r.id) === String(id));
    if(!record) {
        alert("No se encontró el registro seleccionado.");
        return;
    }

    if(!silent) {
        if(state.currentUser.role !== 'admin') {
            alert("Solo los administradores pueden editar estudios guardados.");
            return;
        }
        if(!confirm("¿Desea cargar este estudio para edición? Se reemplazarán los datos actuales.")) return;
    }

    try {
        // 1. Restore State
        state.currentStudyId = record.id;
        state.patient = JSON.parse(JSON.stringify(record.patient));
        state.clinical = JSON.parse(JSON.stringify(record.clinical));
        state.metadata = JSON.parse(JSON.stringify(record.metadata));
        state.quality = JSON.parse(JSON.stringify(record.quality));
        state.findings = JSON.parse(JSON.stringify(record.findings || []));
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
    renderGallery();
    switchMainView('new');
}

function filterHistory(val) { renderHistory(val); }

function deleteFromHistory(id) {
    if(state.currentUser.role !== 'admin') {
        alert("Solo los administradores pueden eliminar estudios.");
        return;
    }
    if(confirm("¿Eliminar este registro de forma permanente?")) {
        state.history = state.history.filter(r => String(r.id) !== String(id));
        localStorage.setItem('endo_history', JSON.stringify(state.history));
        renderHistory();
    }
}

function clearHistory() {
    if(state.currentUser.role !== 'admin') return;
    if(confirm("¿BORRAR TODO EL HISTORIAL? Esta acción no se puede deshacer.")) {
        state.history = [];
        localStorage.setItem('endo_history', JSON.stringify(state.history));
        renderHistory();
    }
}

function exportToCSV() {
    if(state.history.length === 0) { alert("No hay datos para exportar."); return; }
    const headers = ["ID", "Fecha", "Nombre", "DNI", "Edad", "Sexo", "Procedencia", "ASA", "Indicación", "Conclusión"];
    const rows = state.history.map(r => [
        r.id, 
        r.date, 
        r.patient.nombre, 
        r.patient.dni, 
        r.patient.edad, 
        r.patient.sexo, 
        `${r.patient.municipio || ''}, ${r.patient.departamento || ''}`,
        r.clinical.asa, 
        r.metadata.indicacion, 
        (r.diagnoses || "").replace(/\n/g, " ")
    ]);
    let csv = "\uFEFF" + headers.join(";") + "\n";
    rows.forEach(row => csv += row.map(cell => `"${cell || ''}"`).join(";") + "\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Endoscopia_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}
