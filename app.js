/* ==========================================================================
   TELEPROMPTER PRO V9 - ESTILOS GENERALES (TEMA OSCURO PRO DE ESTUDIO)
   ========================================================================== */
:root {
    --bg-main: #060913;
    --bg-card: #0b1122;
    --bg-input: #0f172a;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --neon-blue: #00d2ff;
    --neon-purple: #7928ca;
    --neon-green: #00ffa3;
    --accent-red: #ff2a5f;
    --accent-yellow: #ffb800;
    --border-glow: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
    --font-stack: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: var(--font-stack);
    -webkit-tap-highlight-color: transparent;
}

body {
    background-color: var(--bg-main);
    color: var(--text-main);
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

/* Opciones de Temas visuales globales */
body.theme-oled {
    --bg-main: #000000;
    --bg-card: #0a0a0a;
    --bg-input: #121212;
}
body.theme-light {
    --bg-main: #f1f5f9;
    --bg-card: #ffffff;
    --bg-input: #e2e8f0;
    --text-main: #0f172a;
    --text-muted: #64748b;
}

/* HEADER DEL SISTEMA */
.app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    margin-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.app-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(to right, #ffffff, var(--neon-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-badges {
    display: flex;
    gap: 10px;
}

.badge {
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

#vustat { color: var(--neon-blue); }
#storageStat { color: var(--neon-green); }

/* LAYOUT PRINCIPAL DINÁMICO (RESPONSIVO) */
.main-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    width: 100%;
}

/* CONTENEDOR DE LA CÁMARA Y MONITOR */
.viewport-wrapper-layout {
    display: flex;
    flex-direction: column;
    gap: 15px;
    position: relative;
}

.viewport-outer-container {
    background: var(--bg-card);
    padding: 4px;
    border-radius: 24px;
    position: relative;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

/* Efecto de borde de neón inteligente del monitor */
.viewport-outer-container::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 24px;
    padding: 2px;
    background: var(--border-glow);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

.viewport-outer {
    width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    background: #000;
}

/* Relaciones de aspecto dinámicas */
.viewport-outer.format-16-9 { aspect-ratio: 16 / 9; }
.viewport-outer.format-9-16 { aspect-ratio: 9 / 16; max-width: 450px; margin: 0 auto; }

.viewport-container {
    width: 100%;
    height: 100%;
    position: relative;
}

#video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background-color: #111;
}

/* CAPA SUPERPUESTA DEL TELEPROMPTER */
.prompter-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.prompter-text {
    position: absolute;
    left: 10%;
    right: 10%;
    width: 80%;
    color: var(--neon-green);
    font-weight: 700;
    line-height: 1.5;
    text-align: center;
    text-shadow: 0px 2px 8px rgba(0, 0, 0, 0.9);
    white-space: pre-wrap;
    transform: translateY(0px);
}

/* Guía de lectura central (Líneas rojas del diseño) */
.reading-guide {
    position: absolute;
    top: 40%;
    left: 5%;
    width: 90%;
    height: 60px;
    border-top: 2px solid rgba(255, 42, 95, 0.8);
    border-bottom: 2px solid rgba(255, 42, 95, 0.8);
    pointer-events: none;
    z-index: 5;
}

/* Overlays informativos flotantes en el video */
.countdown-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(6, 9, 19, 0.9);
    display: none;
    justify-content: center;
    align-items: center;
    font-size: 6rem;
    font-weight: 900;
    color: var(--neon-blue);
    z-index: 10;
}

.pause-indicator {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 184, 0, 0.9);
    color: #000;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 1rem;
    display: none;
    letter-spacing: 1px;
    z-index: 8;
}

.recording-badge {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 42, 95, 0.9);
    padding: 5px 12px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
    animation: pulse 1.5s infinite;
    display: none;
    z-index: 7;
}

@keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
}

/* BOTONES FLOTANTES DE CONTROL PRINCIPAL */
.external-floating-controls {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    width: 100%;
}

.btn-floating {
    background: var(--bg-card);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-main);
    padding: 12px 6px;
    border-radius: 14px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all 0.2s ease;
}

.btn-floating:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.btn-start { border-left: 4px solid var(--accent-red); }
.btn-pause { border-left: 4px solid var(--accent-yellow); }
.btn-reset { border-left: 4px solid var(--neon-blue); }
.btn-camera { border-left: 4px solid var(--neon-green); }
.btn-stop { border-left: 4px solid var(--text-muted); }

.btn-floating:active:not(:disabled) {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.05);
}

/* PANEL DE SECCIONES (ACORDEÓN / TARJETAS) */
.controls-card {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.control-section {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.03);
}

.control-section h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.step-tag {
    background: rgba(121, 40, 202, 0.2);
    color: #cb6ce6;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
}

/* FORMULARIOS Y SELECTORES */
.options-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 10px;
}

.option-box {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
}

select, textarea {
    background: var(--bg-input);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-main);
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 0.85rem;
    outline: none;
    width: 100%;
    transition: border-color 0.2s;
}

select:focus, textarea:focus {
    border-color: var(--neon-blue);
}

/* DESLIZADORES (RANGE SLIDERS) */
.setting-row {
    margin-bottom: 15px;
}

.setting-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.font-badge, .duration-badge {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--neon-blue);
}

input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: var(--bg-input);
    border-radius: 3px;
    outline: none;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--text-main);
    box-shadow: 0 0 8px var(--neon-blue);
    cursor: pointer;
}

/* EDITOR DE TEXTO */
textarea {
    height: 120px;
    resize: none;
    line-height: 1.4;
}

.script-manager-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.btn-action {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-main);
    padding: 8px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
}

.btn-danger {
    color: var(--accent-red);
    background: rgba(255, 42, 95, 0.05);
}

/* BARRA DE DATOS INFERIOR (OCULTA POR DEFECTO EN MÓVIL) */
.pc-info-footer-bar {
    display: none;
}


/* ==========================================================================
   MEDIA QUERY: OPTIMIZACIÓN COMPLETA PARA PC Y LAPTOP (PANTALLAS GRANDES)
   ========================================================================== */
@media (min-width: 1024px) {
    body {
        padding: 30px;
        max-width: 1440px;
        margin: 0 auto;
        height: 100vh;
    }

    .app-header {
        margin-bottom: 25px;
    }

    /* Distribución en rejilla horizontal como la captura de PC */
    .main-layout {
        grid-template-columns: 1.1fr 0.9fr;
        gap: 30px;
        align-items: start;
        flex: 1;
    }

    /* Caja izquierda: Alinea Monitor + Botones en fila horizontal */
    .viewport-wrapper-layout {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: start;
    }

    /* Los controles principales se vuelven una barra vertical al lado del monitor */
    .external-floating-controls {
        grid-template-columns: 1fr;
        width: 110px;
        gap: 12px;
    }

    .btn-floating {
        padding: 20px 10px;
        border-radius: 16px;
        font-size: 0.8rem;
        height: 75px;
    }

    /* El panel de configuraciones se va al extremo derecho de la pantalla */
    .controls-card {
        max-height: calc(100vh - 140px);
        overflow-y: auto;
        padding-right: 5px;
    }

    /* Barra de datos rápidos debajo del monitor (Fila inferior de telemetría de PC) */
    .pc-info-footer-bar {
        display: flex;
        grid-column: 1 / span 2;
        background: var(--bg-card);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 14px;
        padding: 15px;
        margin-top: 10px;
        justify-content: space-around;
        align-items: center;
    }

    .pc-footer-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .pc-footer-item span:first-child {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .pc-footer-item span:last-child {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--neon-blue);
    }
}
