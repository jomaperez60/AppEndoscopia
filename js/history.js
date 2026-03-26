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
        const res = await fetch('https://endohn.netlify.app/studies', {
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
        const res = await fetch(`https://endohn.netlify.app/studies?search=${encodeURIComponent(filter)}`, {
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
        const res = await fetch(`https://endohn.netlify.app/studies/${id}`, {
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
                if(muniSelect) {
                    muniSelect.value = record.patient.municipio || '';
                    state.patient.municipio = record.patient.municipio || '';
                }
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
            const res = await fetch(`https://endohn.netlify.app/studies/${id}`, {
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

    fetch('https://endohn.netlify.app/studies/export/csv', {
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
