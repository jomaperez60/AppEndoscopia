// --- Live Video Capture & WebRTC Logic ---

let videoStream = null;
let isDraggingCrop = false;
let dragType = ''; // 'move' or 'resize'

async function initWebcam() {
    const videoSelect = document.getElementById('capture-device-select');
    if (!videoSelect) return;

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        videoSelect.innerHTML = '<option value="">Seleccione Fuente...</option>';
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Cámara ${videoSelect.length}`;
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
    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };

    try {
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = videoStream;
        state.captureDeviceId = deviceId;
        return true;
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la fuente de video. Verifique los permisos del navegador.");
        return false;
    }
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
        dragType = e.target.classList.contains('resizer') ? 'resize' : 'move';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingCrop) return;

        const rect = overlay.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        if (dragType === 'move') {
            state.captureCrop.x = Math.max(0, Math.min(100 - state.captureCrop.width, mouseX - state.captureCrop.width / 2));
            state.captureCrop.y = Math.max(0, Math.min(100 - state.captureCrop.height, mouseY - state.captureCrop.height / 2));
        } else if (dragType === 'resize') {
            state.captureCrop.width = Math.max(5, Math.min(100 - state.captureCrop.x, mouseX - state.captureCrop.x));
            state.captureCrop.height = Math.max(5, Math.min(100 - state.captureCrop.y, mouseY - state.captureCrop.y));
        }

        updateCropBoxUI();
    });

    window.addEventListener('mouseup', () => {
        isDraggingCrop = false;
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
