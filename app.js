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

    updateTopbar();

    const planEl = document.getElementById('plan');
    if(planEl) planEl.addEventListener('input', (e) => state.plan = e.target.value);
});

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
        const uniqueOrgans = [...new Set(state.findings.map(f => f.organ))];
        let diagText = `Hallazgos patológicos en: ${uniqueOrgans.join(', ')}.\n`;
        state.findings.forEach(f => { diagText += `- ${f.organ}: ${f.description}\n`; });
        diagArea.value = diagText;
    }
}

function generateReport() {
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
            <div class="report-section">
                <h4>5. Diagnóstico Final</h4>
                <div style="padding-left: 10px; white-space: pre-wrap;">${document.getElementById('diag-final').value}</div>
            </div>
            <div class="report-section">
                <h4>6. Plan y Recomendaciones</h4>
                <div style="padding-left: 10px; white-space: pre-wrap;">${state.plan || 'Sin recomendaciones adicionales.'}</div>
            </div>
        </div>`;

    body.innerHTML = html;
    modal.classList.add('active');
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
            .report-label { font-weight: bold; width: 150px; }
            @media print { body { margin: 0; padding: 0; } }
        </style></head>
        <body>${reportContent}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}
