async function renderUsers() {
    const body = document.getElementById('users-table-body');
    if (!body) return;

    const token = sessionStorage.getItem('endo_token');
    if (!token) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/users`, {
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
        const res = await fetch(`${CONFIG.API_BASE_URL}/users`, {
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
            const res = await fetch(`https://endohn.netlify.app/users/${username}`, {
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
        const res = await fetch(`https://endohn.netlify.app/users/${userToPasswordChange}/password`, {
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
