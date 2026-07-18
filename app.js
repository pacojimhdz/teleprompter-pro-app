/* ==========================================================================
   TELEPROMPTER PRO V9 - LOGICA DE CONTROL Y AUDIO INTEGRADA
   ========================================================================== */

// Contenedores principales y elementos de hardware
const videoElement = document.getElementById('video');
const videoSource = document.getElementById('videoSource');
const audioSource = document.getElementById('audioSource');
const resolutionSelect = document.getElementById('resolutionSelect');
const fpsSelect = document.getElementById('fpsSelect');
const aspectRatioSelect = document.getElementById('aspectRatioSelect');
const textColorSelect = document.getElementById('textColorSelect');

// Controles del Prompter
const fontSizeInput = document.getElementById('fontSize');
const scrollSpeedInput = document.getElementById('scrollSpeed');
const scriptInput = document.getElementById('scriptInput');

// Botones de acción vertical
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');
const btnToggleCamera = document.getElementById('btnToggleCamera');
const btnStop = document.getElementById('btnStop');

// Estado de la aplicación
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let audioContext = null;
let audioSourceNode = null;
let filterNode = null;
let isRecording = false;

// 1. Inicialización y Listado de Dispositivos de Hardware
async function initHardware() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Limpiar selectores
        videoSource.innerHTML = '';
        audioSource.innerHTML = '';
        
        let camCount = 0;
        let micCount = 0;

        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            
            if (device.kind === 'videoinput') {
                camCount++;
                option.text = device.label || `Cámara ${camCount}`;
                videoSource.appendChild(option);
            } else if (device.kind === 'audioinput') {
                micCount++;
                option.text = device.label || `Micrófono ${micCount}`;
                audioSource.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error al acceder a los dispositivos de hardware:", error);
    }
}

// 2. Activación e Interrupción de la Cámara
async function startCamera() {
    if (stream) {
        stopCamera();
    }

    const videoId = videoSource.value;
    const audioId = audioSource.value;

    const constraints = {
        video: videoId ? { deviceId: { exact: videoId }, width: 1920, height: 1080 } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true
    };

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        
        // Configurar el procesamiento de audio y filtros
        setupAudioPipeline(stream);
        
        btnStart.disabled = false;
        btnToggleCamera.textContent = "📷 APAGAR";
        btnToggleCamera.parentElement.classList.add('active');
    } catch (err) {
        console.error("No se pudo activar la cámara o micrófono:", err);
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        stream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    btnToggleCamera.textContent = "📷 CAMBIAR CÁMARA";
    btnStart.disabled = true;
}

// 3. Procesamiento de Audio y Filtros de Entrada
function setupAudioPipeline(mediaStream) {
    try {
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) return;

        // Crear contexto de audio para procesar la señal
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSourceNode = audioContext.createMediaStreamSource(mediaStream);
        
        // Filtro Pasa Altas para limpiar ruidos de fondo de baja frecuencia
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'highpass';
        filterNode.frequency.value = 80; // Corta ruidos por debajo de 80Hz
        
        // Conexión del flujo
        audioSourceNode.connect(filterNode);
        
        console.log("Filtros de audio inicializados correctamente.");
    } catch (e) {
        console.error("Error al inicializar los filtros de audio:", e);
    }
}

// 4. Funciones de Grabación de Video con Soporte Universal y Alta Calidad
    function startRecording() {
        if (!stream) return;
        
        recordedChunks = [];
        let recordingStream = stream;

        if (audioContext && filterNode) {
            const destination = audioContext.createMediaStreamDestination();
            filterNode.connect(destination);
            
            const videoTrack = stream.getVideoTracks()[0];
            const filteredAudioTrack = destination.stream.getAudioTracks()[0];
            
            recordingStream = new MediaStream([videoTrack, filteredAudioTrack]);
        }

        // SELECCIÓN DE CÓDEC SEGURO CON BITRATE DE ALTA DEFINICIÓN (10 Mbps)
        let options = { 
            mimeType: 'video/webm',
            videoBitsPerSecond: 10000000 // 10 Mbps para conservar nitidez nativa
        };
        
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { 
                mimeType: 'video/webm;codecs=vp8',
                videoBitsPerSecond: 10000000
            };
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { 
                mimeType: 'video/mp4',
                videoBitsPerSecond: 10000000
            };
        }

        try {
            mediaRecorder = new MediaRecorder(recordingStream, options);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                
                // Determinar extensión correcta según el contenedor real
                const ext = (mediaRecorder.mimeType && mediaRecorder.mimeType.includes('mp4')) ? 'mp4' : 'webm';
                a.download = `teleprompter-hd-${Date.now()}.${ext}`;
                a.click();
            };

            mediaRecorder.start(1000); // Captura fragmentos cada segundo para estabilidad
            isRecording = true;
            
            if (btnStart) btnStart.innerHTML = '<span class="btn-dot"></span> GRABANDO';
            if (btnStop) btnStop.disabled = false;
            console.log("Grabación HD iniciada a 10 Mbps:", options.mimeType);
        } catch (e) {
            console.error("Fallo definitivo al crear MediaRecorder de alta calidad:", e);
        }
    }

// 5. Eventos de los Botones de la Interfaz
btnToggleCamera.addEventListener('click', () => {
    if (!stream) {
        startCamera();
    } else {
        stopCamera();
    }
});

btnStart.addEventListener('click', () => {
    if (!isRecording) {
        startRecording();
    }
});

btnStop.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    }
});

btnPause.addEventListener('click', () => {
    if (mediaRecorder && isRecording) {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            btnPause.innerHTML = '<span class="btn-icon">▶</span> REANUDAR';
        } else if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            btnPause.innerHTML = '<span class="btn-icon">⏸</span> PAUSA';
        }
    }
});

btnReset.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    }
    if (stream) {
        stopCamera();
        startCamera();
    }
});

// Inicialización automática al cargar el documento
window.addEventListener('DOMContentLoaded', () => {
    initHardware();
    
    // Solicitar permisos iniciales de hardware de manera silenciosa
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(initialStream => {
            initialStream.getTracks().forEach(track => track.stop());
            initHardware();
        })
        .catch(err => console.log("Esperando interacción para permisos de hardware."));
});
