const CONFIG = {
    // API_BASE_URL: 'https://endohn.netlify.app' // Producción
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://endohn.netlify.app'
};

const state = {
    patient: {
        nombre: '',
        dni: '',
        fnacimiento: '',
        sexo: '',
        pais: 'Honduras',
        departamento: '',
        municipio: '',
        localidad: '',
        antecedentes: '',
        alergias: '',
        edad: ''
    },
    clinical: {
        referente: '',
        asa: 'ASA I (Normal, sano)',
        anticoagulante: 'No',
        antiTipo: 'Aspirina',
        antiDias: '',
        preparacion: 'Adecuado (Ayuno > 8h)'
    },
    quality: {
        consentimiento: 'Sí, obtenido y firmado',
        fotos: 'Estándar (≥ 10 fotos)',
        completa: 'Sí (incluye retrovisión)',
        tiempo: '≥ 7 minutos',
        aeHipo: false,
        aeBradi: false,
        aePerf: false,
        aeSang: false
    },
    images: [], // { data, x, y, id, label }
    selectedImageIndex: null,
    // Video Capture Settings
    captureDeviceId: '',
    captureCrop: JSON.parse(localStorage.getItem('endo_capture_crop') || '{"x": 10, "y": 10, "width": 80, "height": 80}'), // Porcentaje
    captureKey: 'F12', // Tecla por defecto (común en software médico)
    isCapturing: false,
    history: JSON.parse(localStorage.getItem('endo_history') || '[]'),
    metadata: {
        indicacion: '',
        sedacion: 'Sedación Consciente',
        instrumento: 'Olympus',
        trazProcesador: '',
        trazCana: '',
        trazLavado: '',
        extension: 'Duodeno D2'
    },
    findings: [],
    procedimientos: [],
    plan: '',
    histology: '',
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
