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
    settings: JSON.parse(localStorage.getItem('endo_settings') || '{"hospital":"Hospital Local","physician":"Dr. Clínico","location":"","specialty":"","language":"es","units":"cm","logo":null}')
};

function calculateAge(dateString) {
    if (!dateString) { state.patient.edad = ''; updateTopbar(); return; }
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    state.patient.edad = age;
    updateTopbar();
}

function updateTopbar() {
    document.getElementById('topbar-name').innerText = state.patient.nombre || 'Nuevo Paciente';
    document.getElementById('topbar-dni').innerText = `DNI: ${state.patient.dni || '-'}`;
    document.getElementById('topbar-age').innerText = `Edad: ${state.patient.edad !== '' ? state.patient.edad + ' años' : '-'}`;
    document.getElementById('topbar-sex').innerText = `Sexo: ${state.patient.sexo ? state.patient.sexo.charAt(0) : '-'}`;
}

let currentOrgan = '';
let currentMstSelection = [];

document.addEventListener('DOMContentLoaded', () => {
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
        if(el) el.addEventListener('change', (e) => state.metadata[id] = e.target.value);
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

// --- Image Tagging Logic ---

function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            state.images.push({
                data: event.target.result,
                x: null,
                y: null,
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
        
        div.innerHTML = `
            <div class="tile-number">${index + 1}</div>
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

function handleDiagramClick(e) {
    if (state.selectedImageIndex === null) {
        alert("Por favor, seleccione primero una imagen de la galería de la izquierda.");
        return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    state.images[state.selectedImageIndex].x = x;
    state.images[state.selectedImageIndex].y = y;
    
    // Auto select next untagged image
    const nextUntagged = state.images.findIndex((img, idx) => img.x === null && idx !== state.selectedImageIndex);
    if(nextUntagged !== -1) {
        state.selectedImageIndex = nextUntagged;
    }

    renderGallery();
}

function renderTags() {
    const svg = document.getElementById('tag-overlay');
    if(!svg) return;
    
    svg.innerHTML = '';
    state.images.forEach((img, index) => {
        if (img.x === null) return;

        // Draw Square
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", `${img.x - 2.5}%`);
        rect.setAttribute("y", `${img.y - 2.5}%`);
        rect.setAttribute("width", "5%");
        rect.setAttribute("height", "5%");
        rect.setAttribute("class", "tag-box");
        if(state.selectedImageIndex === index) rect.setAttribute("stroke", "white");
        svg.appendChild(rect);

        // Draw number
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", `${img.x}%`);
        text.setAttribute("y", `${img.y + 1.5}%`);
        text.setAttribute("class", "tag-text");
        text.setAttribute("text-anchor", "middle");
        text.textContent = index + 1;
        svg.appendChild(text);
    });
}

function clearAllTags() {
    state.images.forEach(img => {
        img.x = null;
        img.y = null;
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
                <div style="font-size: 0.9rem; color: #666; margin-top: 8px;">Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 0.95rem;">
                <tr style="background: #f9fafb; border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold; width: 120px;">PACIENTE:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.nombre || 'No registro'}</td>
                    <td style="padding: 10px; font-weight: bold; width: 100px;">DNI:</td>
                    <td style="padding: 10px;">${state.patient.dni || 'No registro'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">EDAD / SEXO:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.patient.edad ? state.patient.edad + ' años' : '-'} / ${state.patient.sexo || '-'}</td>
                    <td style="padding: 10px; font-weight: bold;">PROCEDENCIA:</td>
                    <td style="padding: 10px;">${state.patient.municipio ? state.patient.municipio + ', ' : ''}${state.patient.departamento || '-'}</td>
                </tr>
                <tr style="border: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">MÉDICO REF:</td>
                    <td style="padding: 10px; border-right: 1px solid #eee;">${state.clinical.referente || 'No especificado'}</td>
                    <td style="padding: 10px; font-weight: bold;">INDICACIÓN:</td>
                    <td style="padding: 10px;">${state.metadata.indicacion || 'Screening'}</td>
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
                <div style="background: #333; color: white; padding: 6px 12px; font-weight: bold; margin-bottom: 15px; border-radius: 2px;">DOCUMENTACIÓN FOTOGRÁFICA</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    ${state.images.map((img, i) => `
                        <div style="text-align: center;">
                            <img src="${img.data}" style="width: 100%; height: 140px; object-fit: cover; border: 1px solid #eee; border-radius: 4px;">
                            <div style="font-size: 0.8rem; margin-top: 5px;"><strong>Fig ${i + 1}:</strong> ${img.label}</div>
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
        id: Date.now(),
        date: new Date().toLocaleDateString('es-ES'),
        dateTime: new Date().toLocaleString('es-ES'),
        patient: { ...state.patient },
        clinical: { ...state.clinical },
        metadata: { ...state.metadata },
        quality: { ...state.quality },
        diagnoses: document.getElementById('diag-final').value,
        plan: state.plan,
        findings: [ ...state.findings ]
    };

    state.history.unshift(record);
    localStorage.setItem('endo_history', JSON.stringify(state.history));
    alert("Estudio guardado exitosamente en el historial.");
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
    } catch(err) {
        console.error("Error viewing detail:", err);
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
            'paciente-departamento': state.patient.departamento,
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
            'diag-final': record.diagnoses,
            'plan': state.plan
        };

        Object.keys(fieldMap).forEach(key => {
            const el = document.getElementById(key);
            if(el) el.value = fieldMap[key] || '';
        });

        // Specific handling for municipios (trigger depto change first)
        const deptoSelect = document.getElementById('paciente-departamento');
        if(deptoSelect) {
            deptoSelect.dispatchEvent(new Event('change'));
            const muniSelect = document.getElementById('paciente-municipio');
            if(muniSelect) muniSelect.value = state.patient.municipio || '';
        }

        // 3. Update Visual UI
        updateTopbar();
        updateFindingsList();
        renderGallery();
        
        // 4. Important: Switch View
        if(!silent) {
            switchMainView('new');
        }
    } catch (e) {
        console.error("Critical error loading history:", e);
        if(!silent) alert("Hubo un error al cargar los datos. Por favor, intente de nuevo.");
    }
}

function filterHistory(val) { renderHistory(val); }

function deleteFromHistory(id) {
    if(state.currentUser.role !== 'admin') {
        alert("Solo los administradores pueden eliminar estudios.");
        return;
    }
    if(confirm("¿Eliminar este registro?")) {
        state.history = state.history.filter(r => String(r.id) !== String(id));
        localStorage.setItem('endo_history', JSON.stringify(state.history));
        renderHistory();
    }
}

function clearHistory() {
    if(confirm("¿Borrar todo el historial?")) {
        state.history = [];
        localStorage.setItem('endo_history', JSON.stringify(state.history));
        renderHistory();
    }
}

function resetForm() {
    if(confirm("¿Desea limpiar el formulario para un nuevo estudio?")) {
        // Reset state
        state.patient = { nombre:'', dni:'', fnacimiento:'', sexo:'', departamento:'', municipio:'', antecedentes:'', edad:'' };
        state.findings = [];
        state.images = [];
        state.plan = '';
        state.selectedImageIndex = null;
        
        // UI Clean up
        document.querySelectorAll('input, select, textarea').forEach(el => el.value = '');
        updateTopbar();
        updateFindingsList();
        renderGallery();
        switchMainView('new');
    }
}

function exportToCSV() {
    if(state.history.length === 0) { alert("No hay datos."); return; }
    const headers = ["ID", "Fecha", "Nombre", "DNI", "Edad", "Sexo", "ASA", "Indicación", "Diagnóstico"];
    const rows = state.history.map(r => [r.id, r.date, r.patient.nombre, r.patient.dni, r.patient.edad, r.patient.sexo, r.clinical.asa, r.metadata.indicacion, (r.diagnoses || "").replace(/\n/g, " ")]);
    let csv = "\uFEFF" + headers.join(";") + "\n";
    rows.forEach(row => csv += row.map(cell => `"${cell || ''}"`).join(";") + "\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Endoscopia_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}
