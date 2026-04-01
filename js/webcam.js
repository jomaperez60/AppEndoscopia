// --- Live Video Capture & WebRTC Logic ---

let videoStream = null;
let isDraggingCrop = false;
let dragType = ''; // 'move' or 'resize'

async function initWebcam() {
    const videoSelect = document.getElementById('capture-device-select');
    if (!videoSelect) return;

    try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        let videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Si no hay etiquetas (nombres), forzamos una solicitud de permiso
        if (videoDevices.length > 0 && !videoDevices[0].label) {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(track => track.stop());
                devices = await navigator.mediaDevices.enumerateDevices();
                videoDevices = devices.filter(device => device.kind === 'videoinput');
            } catch (pErr) {
                console.warn("Permiso denegado o cancelado durante calentamiento:", pErr);
            }
        }

        videoSelect.innerHTML = '<option value="">Seleccione Fuente...</option>';
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Cámara ${index + 1}`;
            videoSelect.appendChild(option);
        });

        if (state.captureDeviceId) {
            videoSelect.value = state.captureDeviceId;
        }
    } catch (err) {
        console.error("Error enumerando dispositivos:", err);
    }
}

async function toggleLiveCapture() {
    const btn = document.getElementById('toggle-webcam-btn');
    const container = document.getElementById('live-capture-container');
    const video = document.getElementById('live-video');

    if (state.isCapturing) {
        stopStream();
        btn.innerHTML = '<i class="fa-solid fa-video"></i> Iniciar Captura en Vivo';
        btn.classList.remove('active');
        container.style.display = 'none';
        state.isCapturing = false;
    } else {
        const deviceId = document.getElementById('capture-device-select').value;
        if (!deviceId) {
            alert("Por favor, seleccione una fuente de video (Capturadora o Cámara).");
            return;
        }
        const success = await startStream(deviceId);
        if (success) {
            btn.innerHTML = '<i class="fa-solid fa-video-slash"></i> Detener Captura';
            btn.classList.add('active');
            container.style.display = 'block';
            state.isCapturing = true;
            initCropOverlay();
        }
    }
}

async function startStream(deviceId) {
    const video = document.getElementById('live-video');
    const msg = document.getElementById('no-signal-msg');
    
    // Lista de intentos (Fallback)
    const attempts = [
        { video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
        { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { deviceId: { exact: deviceId } } }
    ];

    let lastError = null;

    for (const constraints of attempts) {
        try {
            console.log("Intentando captura con:", constraints);
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = videoStream;
            
            // Forzar reproducción (Safari/Mac)
            await video.play();
            
            state.captureDeviceId = deviceId;
            if (msg) msg.style.display = 'none';
            return true;
        } catch (err) {
            lastError = err;
            console.warn("Fallo interno en intento de resolución:", err.name);
            continue; // Reintentar con el siguiente
        }
    }

    console.error("No se pudo iniciar el video tras varios intentos:", lastError);
    alert(`Error de Cámara (${lastError.name}):\n${lastError.message}\n\nAsegúrese de que la cámara no esté siendo usada por otro programa (Zoom, Teams, etc) y que tenga permisos en el navegador.`);
    return false;
}

function stopStream() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

function captureFrame() {
    if (!state.isCapturing) return;

    const video = document.getElementById('live-video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Medidas reales del video
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Coordenadas de recorte (convertir porcentaje a píxeles)
    const sx = (state.captureCrop.x / 100) * videoWidth;
    const sy = (state.captureCrop.y / 100) * videoHeight;
    const sWidth = (state.captureCrop.width / 100) * videoWidth;
    const sHeight = (state.captureCrop.height / 100) * videoHeight;

    // Redimensionar canvas al tamaño del recorte
    canvas.width = sWidth;
    canvas.height = sHeight;

    // Dibujar el cuadro recortado
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

    // Convertir a DataURL (JPEG 70%)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    // Añadir al estado
    state.images.push({
        data: dataUrl,
        x1: null, y1: null,
        x2: null, y2: null,
        label: 'Captura en vivo',
        id: Date.now()
    });

    renderGallery();
    
    // Feedback visual (flash)
    const container = document.getElementById('live-capture-container');
    container.style.opacity = '0.5';
    setTimeout(() => container.style.opacity = '1', 100);
}

function initCropOverlay() {
    const overlay = document.getElementById('crop-overlay');
    const box = document.getElementById('crop-box');
    if (!overlay || !box) return;

    updateCropBoxUI();

    box.addEventListener('mousedown', (e) => {
        isDraggingCrop = true;
        // Identificar qué manejador se clickeó o si fue el centro (move)
        const handle = e.target.classList.contains('resizer') ? e.target.className.split(' ')[1] : 'move';
        dragType = handle;
        e.stopPropagation();
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingCrop) return;

        const rect = overlay.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        const crop = state.captureCrop;
        const MIN_SIZE = 5;

        if (dragType === 'move') {
            crop.x = Math.max(0, Math.min(100 - crop.width, mouseX - crop.width / 2));
            crop.y = Math.max(0, Math.min(100 - crop.height, mouseY - crop.height / 2));
        } else {
            // Resize logic para 8 manejadores
            if (dragType.includes('t')) { // Top
                const deltaY = crop.y - mouseY;
                if (crop.height + deltaY > MIN_SIZE && mouseY >= 0) {
                    crop.y = mouseY;
                    crop.height += deltaY;
                }
            }
            if (dragType.includes('b')) { // Bottom
                const newHeight = mouseY - crop.y;
                if (newHeight > MIN_SIZE && mouseY <= 100) {
                    crop.height = newHeight;
                }
            }
            if (dragType.includes('l')) { // Left
                const deltaX = crop.x - mouseX;
                if (crop.width + deltaX > MIN_SIZE && mouseX >= 0) {
                    crop.x = mouseX;
                    crop.width += deltaX;
                }
            }
            if (dragType.includes('r')) { // Right
                const newWidth = mouseX - crop.x;
                if (newWidth > MIN_SIZE && mouseX <= 100) {
                    crop.width = newWidth;
                }
            }
        }

        updateCropBoxUI();
    });

    window.addEventListener('mouseup', () => {
        if (isDraggingCrop) {
            isDraggingCrop = false;
            // Guardar persistencia
            localStorage.setItem('endo_capture_crop', JSON.stringify(state.captureCrop));
        }
    });
}

function updateCropBoxUI() {
    const box = document.getElementById('crop-box');
    if (!box) return;

    box.style.left = `${state.captureCrop.x}%`;
    box.style.top = `${state.captureCrop.y}%`;
    box.style.width = `${state.captureCrop.width}%`;
    box.style.height = `${state.captureCrop.height}%`;
}

// Escuchador para configuración inicial
window.addEventListener('load', () => {
    initWebcam();
    const keyDisplay = document.getElementById('current-capture-key');
    if (keyDisplay) keyDisplay.innerText = state.captureKey || 'F12';
});

function startKeyLearning() {
    const btn = document.getElementById('learn-key-btn');
    const display = document.getElementById('current-capture-key');
    
    if (!btn || !display) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Presione el botón del endoscopio...';
    btn.classList.add('btn-primary');

    const listener = (e) => {
        e.preventDefault();
        e.stopPropagation();

        state.captureKey = e.key;
        display.innerText = e.key;
        
        // Finalizar aprendizaje
        window.removeEventListener('keydown', listener, true);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Botón Vinculado!';
        btn.classList.remove('btn-primary');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);

        localStorage.setItem('endo_settings', JSON.stringify(state.settings));
    };

    // Usar 'capture' phase para interceptar antes que otros handlers
    window.addEventListener('keydown', listener, true);
}

// Escuchador global de teclado para el botón del endoscopio
window.addEventListener('keydown', (e) => {
    if (e.key === state.captureKey && state.isCapturing) {
        // Evitar que la tecla dispare comportamientos por defecto del navegador
        e.preventDefault();
        captureFrame();
    }
});
