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
