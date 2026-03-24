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
    plan: ''
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
});

function switchMainView(view) {
    const newView = document.getElementById('dynamic-view');
    const historyView = document.getElementById('history-view');
    const newActions = document.getElementById('topbar-actions');
    const historyActions = document.getElementById('history-actions');
    const navNew = document.getElementById('nav-new');
    const navHistory = document.getElementById('nav-history');

    if (view === 'new') {
        newView.style.display = 'block';
        historyView.style.display = 'none';
        newActions.style.display = 'flex';
        historyActions.style.display = 'none';
        navNew.classList.add('active');
        navHistory.classList.remove('active');
        document.getElementById('topbar-name').textContent = state.patient.nombre || "Nuevo Paciente";
    } else {
        newView.style.display = 'none';
        historyView.style.display = 'block';
        newActions.style.display = 'none';
        historyActions.style.display = 'flex';
        navNew.classList.remove('active');
        navHistory.classList.add('active');
        document.getElementById('topbar-name').textContent = "Base de Datos de Pacientes";
        renderHistory();
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
                findingsHtml += `<strong>${org}:</strong> <ul>`;
                byOrgan[org].forEach(desc => findingsHtml += `<li>${desc}</li>`);
                findingsHtml += `</ul>`;
            } else {
                findingsHtml += `<strong>${org}:</strong> Normal.<br>`;
            }
        });
    }

    const html = `
        <div class="report-document">
            <h1>Reporte de Endoscopia Digestiva Alta</h1>
            <div class="report-section">
                <h4>1. Información del Paciente</h4>
                <div class="report-row"><div class="report-label">Nombre:</div> <div>${state.patient.nombre || 'No especificado'}</div></div>
                <div class="report-row"><div class="report-label">DNI:</div> <div>${state.patient.dni || 'No especificado'}</div></div>
                <div class="report-row"><div class="report-label">Edad / Sexo:</div> <div>${state.patient.edad !== '' ? state.patient.edad + ' años' : 'No esp.'} / ${state.patient.sexo || 'No esp.'}</div></div>
                <div class="report-row"><div class="report-label">Procedencia:</div> <div>${state.patient.municipio ? state.patient.municipio + ', ' : ''}${state.patient.departamento || 'No especificada'}</div></div>
                <div class="report-row"><div class="report-label">Antecedentes:</div> <div>${state.patient.antecedentes || 'Sin antecedentes registrados'}</div></div>
                <div class="report-row"><div class="report-label">Fecha Examen:</div> <div>${new Date().toLocaleDateString('es-ES')}</div></div>
            </div>
            <div class="report-section">
                <h4>2. Datos Clínicos</h4>
                <div class="report-row"><div class="report-label">Médico Referente:</div> <div>${state.clinical.referente || 'No especificado'}</div></div>
                <div class="report-row"><div class="report-label">Riesgo ASA:</div> <div>${state.clinical.asa}</div></div>
                <div class="report-row"><div class="report-label">Anticoag./Antiagreg.:</div> <div>${state.clinical.anticoagulante}</div></div>
                <div class="report-row"><div class="report-label">Preparación:</div> <div>${state.clinical.preparacion}</div></div>
            </div>
            <div class="report-section">
                <h4>3. Datos del Procedimiento</h4>
                <div class="report-row"><div class="report-label">Indicación Médica:</div> <div>${state.metadata.indicacion || 'No especificada'}</div></div>
                <div class="report-row"><div class="report-label">Sedación:</div> <div>${state.metadata.sedacion}</div></div>
                <div class="report-row"><div class="report-label">Instrumento:</div> <div>${state.metadata.instrumento}</div></div>
                <div class="report-row"><div class="report-label">Extensión:</div> <div>Se intuba bajo visión directa hasta ${state.metadata.extension}</div></div>
            </div>
            <div class="report-section">
                <h4>4. Descripción Macroscópica</h4>
                <div style="padding-left: 10px;">${findingsHtml}</div>
            </div>

            ${state.images.length > 0 ? `
            <div class="report-section">
                <h4>5. Registro Fotográfico</h4>
                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <div style="position: relative; width: 250px; border: 1px solid #eee;">
                        <img src="gi_diagram.png" style="width: 100%;">
                        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                            ${state.images.map((img, i) => img.x !== null ? `
                                <rect x="${img.x - 2.5}%" y="${img.y - 2.5}%" width="5%" height="5%" fill="#f1c40f" stroke="black" stroke-width="0.5" rx="1" />
                                <text x="${img.x}%" y="${img.y + 1}%" font-size="8" text-anchor="middle" font-weight="bold" fill="black">${i + 1}</text>
                            ` : '').join('')}
                        </svg>
                    </div>
                    <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 10px;">
                        ${state.images.map((img, i) => `
                            <div style="width: 160px; text-align: center; border: 1px solid #eee; padding: 5px; border-radius: 4px;">
                                <img src="${img.data}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 2px;">
                                <div style="font-size: 10px; color: #333; margin-top: 4px;"><strong>Fig ${i + 1}:</strong> ${img.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="report-section">
                <h4>6. Diagnóstico Final</h4>
                <div style="padding-left: 10px; white-space: pre-wrap;">${document.getElementById('diag-final').value}</div>
            </div>
            <div class="report-section">
                <h4>7. Indicadores de Calidad</h4>
                <div class="report-row"><div class="report-label">Consentimiento:</div> <div>${state.quality.consentimiento}</div></div>
                <div class="report-row"><div class="report-label">Duración Estudio:</div> <div>${state.quality.tiempo}</div></div>
                <div class="report-row"><div class="report-label">Exploración:</div> <div>${state.quality.completa}</div></div>
                <div class="report-row"><div class="report-label">Fotodocumentación:</div> <div>${state.quality.fotos}</div></div>
            </div>
            <div class="report-section">
                <h4>8. Plan y Recomendaciones</h4>
                <div style="padding-left: 10px; white-space: pre-wrap;">${state.plan || 'Sin recomendaciones adicionales.'}</div>
            </div>
        </div>`;

    body.innerHTML = html;
    modal.classList.add('active');

    // Automatically save to history when report is generated (only if new)
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
                <button class="btn btn-icon" title="Cargar para Editar" onclick="loadFromHistory('${r.id}')" style="color: var(--primary); margin-right: 5px;"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn btn-icon" title="Eliminar" onclick="deleteFromHistory('${r.id}')" style="color: var(--danger);"><i class="fa-solid fa-trash"></i></button>
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
