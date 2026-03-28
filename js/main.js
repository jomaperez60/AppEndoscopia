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
            ['input', 'change'].forEach(ev => {
                el.addEventListener(ev, (e) => {
                    state.patient[field] = e.target.value;
                    updateTopbar();
                });
            });
        }
    });

    const planEl = document.getElementById('plan');
    if(planEl) planEl.addEventListener('input', (e) => state.plan = e.target.value);
    
    const histEl = document.getElementById('histology-text');
    if(histEl) histEl.addEventListener('input', (e) => state.histology = e.target.value);
    
    const diagFinalEl = document.getElementById('diag-final');
    if(diagFinalEl) diagFinalEl.addEventListener('input', (e) => state.metadata.diagFinal = e.target.value);

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
