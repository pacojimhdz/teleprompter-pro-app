/* ==========================================================================
   TELEPROMPTER PRO V9 - MOTOR DE CONTROL TOTAL Y CONMUTADOR COMPLETO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando motor unificado de Teleprompter Pro v9...");

    // 1. CAPTURA DE ELEMENTOS DEL DOM
    const videoElement = document.getElementById('video');
    const videoSource = document.getElementById('videoSource');
    const audioSource = document.getElementById('audioSource');

    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnReset = document.getElementById('btnReset');
    const btnStop = document.getElementById('btnStop');
    
    // Capturamos ambos botones de cámara del HTML
    const btnToggleCamera = document.getElementById('btnToggleCamera');
    const btnCamTrigger = document.getElementById('btnCamTrigger');

    // 2. ESTADO GLOBAL DE LA APLICACIÓN
    let stream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;
    
    let videoDevices = []; // Almacén para la rotación de cámaras
    let currentCameraIndex = 0;

    // 3. ESCANEO DE HARDWARE DISPONIBLE (Cámaras y Micrófonos)
    async function initHardware() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.warn("El navegador no soporta acceso multimedia nativo.");
                return;
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            videoDevices = []; // Limpiar arreglo
            
            if (videoSource) videoSource.innerHTML = '';
            
            let camCount = 0;
            let micCount = 0;

            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    videoDevices.push(device);
                    camCount++;
                    if (videoSource) {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Cámara ${camCount}`;
                        videoSource.appendChild(option);
                    }
                } else if (device.kind === 'audioinput') {
                    micCount++;
                    // Solo llenamos el select si existe un contenedor para el audio
                    if (audioSource && audioSource.tagName === 'SELECT') {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Micrófono ${micCount}`;
                        audioSource.appendChild(option);
                    }
                }
            });
            
            console.log(`Hardware detectado: ${videoDevices.length} cámaras mapeadas.`);
        } catch (error) {
            console.error("Error al escanear periféricos:", error);
        }
    }

    // 4. CONTROL DE ENCENDIDO ULTRA RÁPIDO DE CÁMARA
    async function startCameraId(deviceId) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const audioId = (audioSource && audioSource.value) ? audioSource.value : null;
        
        // Configuración elástica inteligente: abre al instante sin retrasos
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            },
            audio: audioId ? { deviceId: { exact: audioId } } : true
        };

        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.setAttribute('playsinline', true);
                await videoElement.play();
            }
            console.log("Cámara vinculada al visor con éxito.");
        } catch (err) {
            console.error("Fallo de arranque ideal, aplicando respaldo inmediato:", err);
            fallbackCamera();
        }
    }

    async function fallbackCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoElement) {
                videoElement.srcObject = stream;
                await videoElement.play();
            }
        } catch (e) {
            console.error("Imposible acceder a la cámara del dispositivo:", e);
        }
    }

    // 5. FUNCIÓN CENTRAL DE CAMBIO DE CÁMARA (ROTACIÓN DE ÍNDICES)
    function switchCamera() {
        if (videoDevices.length <= 1) {
            console.log("No hay múltiples cámaras disponibles para alternar.");
            return;
        }

        // Saltamos al siguiente lente de la lista
        currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
        const nextDevice = videoDevices[currentCameraIndex];
        
        // Sincronizamos visualmente el menú desplegable de la derecha
        if (videoSource) {
            videoSource.value = nextDevice.deviceId;
        }

        console.log(`Cambiando a: ${nextDevice.label || 'Siguiente cámara'}`);
        startCameraId(nextDevice.deviceId);
    }

    // 6. MOTOR DE GRABACIÓN DE ALTA CALIDAD (10 Mbps)
    function startRecording() {
        if (!stream) {
            alert("Primero debes activar los permisos o encender la cámara.");
            return;
        }
        
        recordedChunks = [];
        let options = { mimeType: 'video/webm', videoBitsPerSecond: 10000000 };
        
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 10000000 };
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4', videoBitsPerSecond: 10000000 };
        }

        try {
            mediaRecorder = new MediaRecorder(stream, options);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                const ext = (mediaRecorder.mimeType && mediaRecorder.mimeType.includes('mp4')) ? 'mp4' : 'webm';
                a.download = `teleprompter-hd-${Date.now()}.${ext}`;
                a.click();
            };

            mediaRecorder.start(1000);
            isRecording = true;
            
            if (btnStart) btnStart.innerHTML = '<span class="btn-dot"></span> GRABANDO';
            if (btnStop) btnStop.disabled = false;
        } catch (e) {
            console.error("Error al iniciar grabación:", e);
        }
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            if (btnStart) btnStart.innerHTML = '<span class="btn-dot"></span> GRABAR';
            if (btnStop) btnStop.disabled = true;
        }
    }

    // 7. ASIGNACIÓN ASÍNCRONA DE EVENTOS (TOTALMENTE INDEPENDIENTE DEL TEXTO)
    const handleCameraTrigger = () => {
        if (!stream) {
            if (videoDevices.length > 0) {
                startCameraId(videoDevices[currentCameraIndex].deviceId);
            } else {
                startCameraId(null);
            }
        } else {
            switchCamera();
        }
    };

    if (btnToggleCamera) btnToggleCamera.addEventListener('click', handleCameraTrigger);
    if (btnCamTrigger) btnCamTrigger.addEventListener('click', handleCameraTrigger);

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (!isRecording) startRecording();
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            if (isRecording) stopRecording();
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (mediaRecorder && isRecording) {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.pause();
                    btnPause.innerHTML = '▶ REANUDAR';
                } else if (mediaRecorder.state === 'paused') {
                    mediaRecorder.resume();
                    btnPause.innerHTML = '⏸ PAUSA';
                }
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            stopRecording();
            if (videoDevices.length > 0) {
                startCameraId(videoDevices[currentCameraIndex].deviceId);
            }
        });
    }

    if (videoSource) {
        videoSource.addEventListener('change', () => {
            startCameraId(videoSource.value);
        });
    }

    // 8. EJECUCIÓN AUTOMÁTICA INICIAL
    initHardware().then(() => {
        setTimeout(() => {
            if (videoDevices.length > 0) {
                startCameraId(videoDevices[0].deviceId); // Arranca directo con el primer lente
            }
        }, 400);
    });
});
