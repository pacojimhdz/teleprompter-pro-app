/* ==========================================================================
   TELEPROMPTER PRO V9 - CONMUTACIÓN, GRABACIÓN HD Y DESPLAZAMIENTO DE TEXTO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando motor completo unificado...");

    // 1. CAPTURA DE ELEMENTOS DEL DOM
    const videoElement = document.getElementById('video');
    const videoSource = document.getElementById('videoSource');
    const audioSource = document.getElementById('audioSource');

    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnReset = document.getElementById('btnReset');
    const btnStop = document.getElementById('btnStop');
    const btnToggleCamera = document.getElementById('btnToggleCamera');
    const btnCamTrigger = document.getElementById('btnCamTrigger');

    // Capas de Texto y Sliders
    const prompterOverlay = document.getElementById('prompterOverlay');
    const prompterScroll = document.getElementById('prompterScroll');
    const scriptInput = document.getElementById('scriptInput');
    const fontSizeInput = document.getElementById('fontSize');
    const fontSizeVal = document.getElementById('fontSizeVal');
    const scrollSpeedInput = document.getElementById('scrollSpeed');
    const bgOpacityInput = document.getElementById('bgOpacity');
    const bgOpacityVal = document.getElementById('bgOpacityVal');

    // 2. ESTADO GLOBAL DE LA APLICACIÓN
    let stream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;
    let isPaused = false;
    
    let videoDevices = []; 
    let currentCameraIndex = 0;

    // Estado del Intervalo del Prompter
    let scrollInterval = null;
    let currentScrollY = 0;

    // 3. ACTUALIZACIÓN DINÁMICA DE TEXTO Y CONTROLES
    function updatePrompterText() {
        if (prompterScroll && scriptInput) {
            prompterScroll.innerText = scriptInput.value;
        }
    }

    if (scriptInput) {
        scriptInput.addEventListener('input', updatePrompterText);
        updatePrompterText(); // Carga de texto base
    }

    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', () => {
            const size = fontSizeInput.value + 'rem';
            if (prompterScroll) prompterScroll.style.fontSize = size;
            if (fontSizeVal) fontSizeVal.innerText = size;
        });
    }

    if (bgOpacityInput) {
        bgOpacityInput.addEventListener('input', () => {
            const opacityPct = bgOpacityInput.value;
            if (bgOpacityVal) bgOpacityVal.innerText = opacityPct + '%';
            if (prompterOverlay) {
                prompterOverlay.style.backgroundColor = `rgba(3, 7, 18, ${opacityPct / 100})`;
            }
        });
    }

    // 4. CONTROL DE ANIMACIÓN (DESPLAZAMIENTO AUTOMÁTICO)
    function startPrompterAnimation() {
        if (scrollInterval) clearInterval(scrollInterval);
        
        const speedFactor = scrollSpeedInput ? parseInt(scrollSpeedInput.value) : 100;
        const intervalDelay = 40; 
        const step = (speedFactor / 100) * 1.2; 

        scrollInterval = setInterval(() => {
            if (!isPaused && isRecording) {
                currentScrollY -= step;
                if (prompterScroll) {
                    prompterScroll.style.transform = `translateY(${currentScrollY}px)`;
                }
            }
        }, intervalDelay);
    }

    function stopPrompterAnimation(resetPos = false) {
        if (scrollInterval) clearInterval(scrollInterval);
        if (resetPos) {
            currentScrollY = 0;
            if (prompterScroll) prompterScroll.style.transform = `translateY(0px)`;
        }
    }

    // 5. ESCANEO DE DISPOSITIVOS DE HARDWARE
    async function initHardware() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            videoDevices = [];
            if (videoSource) videoSource.innerHTML = '';

            let camCount = 0;
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
                }
            });
        } catch (error) {
            console.error("Error mapeando el hardware:", error);
        }
    }

    // 6. ENTRADA Y MANEJO DE CÁMARA VELOZ
    async function startCameraId(deviceId) {
        if (stream) stream.getTracks().forEach(track => track.stop());
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: true
        };
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.setAttribute('playsinline', true);
                await videoElement.play();
            }
        } catch (err) {
            fallbackCamera();
        }
    }

    async function fallbackCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoElement) { videoElement.srcObject = stream; await videoElement.play(); }
        } catch (e) { console.error("Fallo total de cámara:", e); }
    }

    function switchCamera() {
        if (videoDevices.length <= 1) return;
        currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
        if (videoSource) videoSource.value = videoDevices[currentCameraIndex].deviceId;
        startCameraId(videoDevices[currentCameraIndex].deviceId);
    }

    // 7. MOTOR DE GRABACIÓN HD (10 Mbps)
    function startRecording() {
        if (!stream) return;
        recordedChunks = [];
        let options = { mimeType: 'video/webm', videoBitsPerSecond: 10000000 };
        
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 10000000 };
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4', videoBitsPerSecond: 10000000 };
        }

        try {
            mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
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
            isPaused = false;
            
            if (btnStart) btnStart.innerHTML = '<span class="btn-dot"></span> GRABANDO';
            if (btnStop) btnStop.disabled = false;
            
            startPrompterAnimation();
        } catch (e) { console.error("Error en grabación:", e); }
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            stopPrompterAnimation(false);
            if (btnStart) btnStart.innerHTML = '<span class="btn-dot"></span> GRABAR';
            if (btnStop) btnStop.disabled = true;
        }
    }

    // 8. ASIGNACIÓN TOTAL DE LISTENERS
    const handleCameraTrigger = () => { if (!stream) startCameraId(null); else switchCamera(); };
    if (btnToggleCamera) btnToggleCamera.addEventListener('click', handleCameraTrigger);
    if (btnCamTrigger) btnCamTrigger.addEventListener('click', handleCameraTrigger);

    if (btnStart) {
        btnStart.addEventListener('click', () => { if (!isRecording) startRecording(); });
    }
    if (btnStop) btnStop.addEventListener('click', stopRecording);

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (mediaRecorder && isRecording) {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.pause();
                    isPaused = true;
                    btnPause.innerHTML = '▶ REANUDAR';
                } else if (mediaRecorder.state === 'paused') {
                    mediaRecorder.resume();
                    isPaused = false;
                    btnPause.innerHTML = '⏸ PAUSA';
                }
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            stopRecording();
            stopPrompterAnimation(true);
            if (videoDevices.length > 0) startCameraId(videoDevices[currentCameraIndex].deviceId);
        });
    }

    if (videoSource) videoSource.addEventListener('change', () => startCameraId(videoSource.value));

    // 9. ARRANQUE EN SEGUNDO PLANO
    initHardware().then(() => {
        setTimeout(() => { if (videoDevices.length > 0) startCameraId(videoDevices[0].deviceId); }, 400);
    });
});
