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
