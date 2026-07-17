// Referencias del DOM
const video = document.getElementById('video');
const textInput = document.getElementById('textInput');
const prompterText = document.getElementById('prompterText');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const cameraBtn = document.getElementById('cameraBtn');
const stopBtn = document.getElementById('stopBtn');
const speedRange = document.getElementById('speedRange');
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeEst = document.getElementById('fontSizeEst');
const countdownOverlay = document.getElementById('countdown');
const recordingBadge = document.getElementById('recordingBadge');
const pauseIndicator = document.getElementById('pauseIndicator');
const durationEst = document.getElementById('durationEst');
const formatSelect = document.getElementById('formatSelect');
const viewportOuter = document.getElementById('viewportOuter');
const viewportContainer = document.getElementById('viewportContainer');
const videoSource = document.getElementById('videoSource');
const audioSource = document.getElementById('audioSource');
const themeSelect = document.getElementById('themeSelect');
const textColorSelect = document.getElementById('textColorSelect');
const resolutionSelect = document.getElementById('resolutionSelect');
const fpsSelect = document.getElementById('fpsSelect');

// Estados del Sistema
let mediaRecorder = null;
let recordedChunks = [];
let animationFrameId = null;
let currentScrollY = 0;
let lastTime = 0;
let isRecording = false;
let isPaused = false;
let pixelesPorMilisegundo = 0;

// Variables Globales de Selección de Hardware (Etapa 1 y 5)
let videoDevices = [];
let currentCameraIndex = 0;

// Inicializador General
window.addEventListener('DOMContentLoaded', async () => {
    cargarConfiguracionSujeta();
    await enumerarDispositivos();
    await initCamera();
    
    setTimeout(() => { 
        resetPrompterPosition(); 
        updateDurationEstimate(); 
        document.querySelector('.prompter-overlay').style.opacity = '0';
    }, 500);
});

// ETAPA 1: Enumeración Completa de Dispositivos (Múltiples Cámaras y Micrófonos)
async function enumerarDispositivos() {
    try {
        // Forzar solicitud previa para obtener etiquetas legibles
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        videoSource.innerHTML = '';
        audioSource.innerHTML = '';
        videoDevices = [];

        devices.forEach(device => {
            if (device.kind === 'videoinput') {
                videoDevices.push(device);
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Cámara ${videoSource.length + 1}`;
                videoSource.appendChild(option);
            } else if (device.kind === 'audioinput') {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Micrófono ${audioSource.length + 1}`;
                audioSource.appendChild(option);
            }
        });
    } catch (e) {
        console.error("Error enumerando hardware de captura: ", e);
    }
}

// ETAPA 1: Inicialización de la Cámara con Parámetros de Resolución y FPS
async function initCamera() {
    if (window.streamRef) {
        window.streamRef.getTracks().forEach(track => track.stop());
    }

    const vId = videoSource.value;
    const aId = audioSource.value;
    const resHeight = parseInt(resolutionSelect.value) || 1080;
    const targetFps = parseInt(fpsSelect.value) || 30;

    const constraints = {
        video: {
            deviceId: vId ? { exact: vId } : undefined,
            width: { ideal: resHeight === 4K ? 3840 : (resHeight === 1080 ? 1920 : 1280) },
            height: { ideal: resHeight === 4K ? 2160 : (resHeight === 1080 : 1080) : 720 },
            frameRate: { ideal: targetFps }
        },
        audio: {
            deviceId: aId ? { exact: aId } : undefined,
            echoCancellation: true,
            noiseSuppression: true
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        window.streamRef = stream;
        video.srcObject = stream;

        // Espejo inteligente automático
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        if (settings.facingMode === 'user' || (!settings.facingMode && videoDevices[currentCameraIndex]?.label.toLowerCase().includes('front'))) {
            video.style.transform = "scaleX(-1)";
        } else {
            video.style.transform = "scaleX(1)";
        }
    } catch (err) {
        console.error("Fallo al levantar stream de video: ", err);
    }
}

// Cambiar de cámara mediante botón flotante (Ciclo continuo)
cameraBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (videoDevices.length > 1) {
        currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
        videoSource.value = videoDevices[currentCameraIndex].deviceId;
        initCamera();
        guardarConfiguracionSujeta();
    }
});

// Eventos de cambios en selectores de hardware
videoSource.addEventListener('change', () => { initCamera(); guardarConfiguracionSujeta(); });
audioSource.addEventListener('change', () => { initCamera(); guardarConfiguracionSujeta(); });
resolutionSelect.addEventListener('change', () => { initCamera(); guardarConfiguracionSujeta(); });
fpsSelect.addEventListener('change', () => { initCamera(); guardarConfiguracionSujeta(); });

// ETAPA 2: Lógica de Scroll e Interfaz del Prompter
formatSelect.addEventListener('change', () => {
    viewportOuter.className = formatSelect.value === '9-16' ? 'viewport-outer format-9-16' : 'viewport-outer format-16-9';
    setTimeout(() => { resetPrompterPosition(); updateDurationEstimate(); }, 150);
    guardarConfiguracionSujeta();
});

fontSizeRange.addEventListener('input', () => {
    const sizeValue = fontSizeRange.value + 'rem';
    prompterText.style.fontSize = sizeValue;
    fontSizeEst.innerText = `Tamaño: ${sizeValue}`;
    setTimeout(() => { resetPrompterPosition(); updateDurationEstimate(); }, 50);
    guardarConfiguracionSujeta();
});

textColorSelect.addEventListener('change', () => {
    prompterText.style.color = textColorSelect.value;
    guardarConfiguracionSujeta();
});

function scrollText(timestamp) {
    if (isPaused) { lastTime = 0; return; }
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    currentScrollY -= (pixelesPorMilisegundo * deltaTime); 
    prompterText.style.transform = `translateY(${currentScrollY}px)`;

    const textHeight = prompterText.clientHeight;
    const containerHeight = viewportContainer.clientHeight;

    if (Math.abs(currentScrollY) > (textHeight + containerHeight)) {
        stopRecordingWorkflow();
    } else {
        animationFrameId = requestAnimationFrame(scrollText);
    }
}

function resetPrompterPosition() {
    const guideTop = document.getElementById('readingGuide').offsetTop;
    currentScrollY = guideTop; 
    prompterText.style.transform = `translateY(${currentScrollY}px)`;
}

function updateDurationEstimate() {
    const texto = textInput.value.trim();
    prompterText.innerText = texto;
    
    if (!texto) {
        durationEst.innerText = "Velocidad: " + speedRange.value + " PPM | Duración: 0:00 min";
        return;
    }

    const totalPalabras = texto.split(/\s+/).filter(p => p.length > 0).length;
    const ppmSeleccionadas = parseInt(speedRange.value);
    const tiempoTotalSegundos = Math.ceil((totalPalabras / ppmSeleccionadas) * 60);
    
    const minutos = Math.floor(tiempoTotalSegundos / 60);
    const segundos = tiempoTotalSegundos % 60;
    durationEst.innerText = `Velocidad: ${ppmSeleccionadas} PPM | Duración: ${minutos}:${segundos < 10 ? '0' : ''}${segundos} min`;

    const textHeight = prompterText.clientHeight;
    if (textHeight > 0) {
        const tiempoTotalMilisegundos = tiempoTotalSegundos * 1000;
        pixelesPorMilisegundo = textHeight / tiempoTotalMilisegundos;
    }
}

speedRange.addEventListener('input', () => { updateDurationEstimate(); guardarConfiguracionSujeta(); });
textInput.addEventListener('input', () => { updateDurationEstimate(); guardarConfiguracionSujeta(); });

// ETAPA 1 & 8: Flujo de Grabación e Interfaz de Captura Profesional
function togglePause() {
    if (!isRecording) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseIndicator.style.display = 'block';
        pauseBtn.innerText = "Seguir";
    } else {
        pauseIndicator.style.display = 'none';
        pauseBtn.innerText = "Pausa";
        lastTime = 0;
        animationFrameId = requestAnimationFrame(scrollText);
    }
}

viewportContainer.addEventListener('click', () => { if (countdownOverlay.style.display !== 'flex') togglePause(); });
pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });

resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isPaused = true; 
    resetPrompterPosition();
    lastTime = 0;
    if (!isRecording) { isPaused = false; } else { pauseIndicator.style.display = 'block'; pauseBtn.innerText = "Seguir"; }
});

startBtn.addEventListener('click', () => {
    if (!textInput.value.trim()) return alert("Ingresa un guion primero.");
    startBtn.disabled = true;
    formatSelect.disabled = true; 
    cameraBtn.disabled = true;
    
    updateDurationEstimate();
    resetPrompterPosition();

    isRecording = false;
    isPaused = false;

    countdownOverlay.style.display = 'flex';
    let count = 3;
    countdownOverlay.innerText = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) { countdownOverlay.innerText = count; } else {
            clearInterval(interval);
            countdownOverlay.style.display = 'none';
            startRecordingAndScroll();
        }
    }, 1000);
});

function startRecordingAndScroll() {
    if (window.streamRef) {
        document.querySelector('.prompter-overlay').style.opacity = '1';

        let options = { mimeType: 'video/mp4;codecs=avc1' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp9' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) { options = { mimeType: 'video/webm' }; }
        }

        try {
            mediaRecorder = new MediaRecorder(window.streamRef, options);
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const tipoContenedor = options.mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
                const blob = new Blob(recordedChunks, { type: tipoContenedor });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `video_teleprompter_${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            mediaRecorder.start();
            isRecording = true;
            recordingBadge.style.display = 'block';
            pauseBtn.disabled = false;
            stopBtn.disabled = false;

            lastTime = 0;
            animationFrameId = requestAnimationFrame(scrollText);
        } catch (e) {
            console.error("Fallo al iniciar MediaRecorder: ", e);
            startBtn.disabled = false;
        }
    }
}

function stopRecordingWorkflow() {
    isRecording = false;
    isPaused = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    
    document.querySelector('.prompter-overlay').style.opacity = '0';
    recordingBadge.style.display = 'none';
    pauseIndicator.style.display = 'none';
    
    startBtn.disabled = false;
    formatSelect.disabled = false;
    cameraBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.innerText = "Pausa";
    resetPrompterPosition();
}

stopBtn.addEventListener('click', (e) => { e.stopPropagation(); stopRecordingWorkflow(); });

// ETAPA 4: Cambio Temas Visuales
themeSelect.addEventListener('change', () => {
    document.body.className = themeSelect.value;
    guardarConfiguracionSujeta();
});

// ETAPA 5: Sistema de Persistencia Automatizada (LocalStorage)
function guardarConfiguracionSujeta() {
    const config = {
        speed: speedRange.value,
        fontSize: fontSizeRange.value,
        format: formatSelect.value,
        theme: themeSelect.value,
        textColor: textColorSelect.value,
        resolution: resolutionSelect.value,
        fps: fpsSelect.value,
        script: textInput.value
    };
    localStorage.setItem('teleprompter_pro_config', JSON.stringify(config));
}

function cargarConfiguracionSujeta() {
    const localData = localStorage.getItem('teleprompter_pro_config');
    if (!localData) return;
    try {
        const config = JSON.parse(localData);
        speedRange.value = config.speed || 215;
        fontSizeRange.value = config.fontSize || 1.6;
        formatSelect.value = config.format || '16-9';
        themeSelect.value = config.theme || 'theme-dark';
        textColorSelect.value = config.textColor || '#00ff00';
        resolutionSelect.value = config.resolution || '1080';
        fpsSelect.value = config.fps || '30';
        textInput.value = config.script || '';

        // Aplicar estilos cargados
        document.body.className = themeSelect.value;
        prompterText.style.fontSize = fontSizeRange.value + 'rem';
        prompterText.style.color = textColorSelect.value;
        viewportOuter.className = formatSelect.value === '9-16' ? 'viewport-outer format-9-16' : 'viewport-outer format-16-9';
        fontSizeEst.innerText = `Tamaño: ${fontSizeRange.value}rem`;
    } catch (e) {
        console.error("Error al parsear configuraciones previas: ", e);
    }
}

// Botones auxiliares de la interfaz de guiones
document.getElementById('clearScriptBtn').addEventListener('click', () => {
    if(confirm("¿Seguro que deseas limpiar el texto actual?")) {
        textInput.value = '';
        updateDurationEstimate();
        guardarConfiguracionSujeta();
    }
});
document.getElementById('saveScriptBtn').addEventListener('click', () => {
    guardarConfiguracionSujeta();
    alert("Guion guardado con éxito en el almacenamiento local.");
});