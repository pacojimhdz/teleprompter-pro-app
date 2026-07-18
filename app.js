// 2. Encender una cámara específica por su ID (Optimizado para arranque inmediato)
    async function startCameraId(deviceId) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const audioId = audioSource ? audioSource.value : null;
        
        // Usamos "ideal" en lugar de "exact" para que abra al instante en cualquier pantalla
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
            console.log("Invocando flujo rápido de cámara...");
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoElement) {
                videoElement.srcObject = stream;
                // Forzar la reproducción nativa inmediata sin retrasos
                videoElement.setAttribute('playsinline', true);
                await videoElement.play();
            }
            console.log("Cámara vinculada al visor instantáneamente.");
        } catch (err) {
            console.error("Retraso o fallo en la cámara, aplicando respaldo veloz:", err);
            fallbackCamera();
        }
    }
