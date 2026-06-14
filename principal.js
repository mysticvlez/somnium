/* FIREBASE Y SESION - Del sistema - Conecta con autenticacion y base de datos */
const firebaseConfig = {
  apiKey: "AIzaSyDG9-c1arjZSzgKoOSYyKIknyKLImZOKV0",
  authDomain: "somnium-ca277.firebaseapp.com",
  projectId: "somnium-ca277",
  storageBucket: "somnium-ca277.firebasestorage.app",
  messagingSenderId: "422410883717",
  appId: "1:422410883717:web:028a21cea808e44c158fec",
  measurementId: "G-S4PT1F1PMM"
};

/* ARRANCAR FIREBASE - Del sistema - Evita inicializacion duplicada */
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();

let usuarioActual = null;
let idUsuario = "default";

/* ESCUCHAR SESION - De Firebase - Extrae perfil y carga los datos del usuario autenticado */
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        idUsuario = user.uid;
        document.getElementById('perfil-correo').value = user.email;
        document.getElementById('perfil-nombre').value = user.displayName || "Usuario Nuevo";
        cargarDatosLocales();
        pedirPermisosAudio();
    } else {
        window.location.href = "index.html";
    }
});

/* ==========================================
   PERMISOS Y SEGUNDO PLANO - Para moviles y pantalla apagada
   ========================================== */

/* PEDIR PERMISOS AUDIO - Al iniciar sesion - Activa reproduccion en segundo plano y pantalla apagada */
function pedirPermisosAudio() {
    /* WAKE LOCK - Del sistema movil - Intenta mantener el audio activo con la pantalla apagada */
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(() => {});
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                navigator.wakeLock.request('screen').catch(() => {});
            }
        });
    }

    /* MEDIA SESSION - Del sistema operativo - Registra controles de audio en pantalla de bloqueo */
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            if (playerYT && ytListo) playerYT.playVideo();
            actualizarBotonesPlay('⏸');
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            if (playerYT && ytListo) playerYT.pauseVideo();
            actualizarBotonesPlay('▶');
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => { saltarCancionPlaylist(-1); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { saltarCancionPlaylist(1); });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (playerYT && ytListo && details.seekTime !== undefined) {
                playerYT.seekTo(details.seekTime, true);
            }
        });
    }

    /* AUDIO CONTEXT - Para iOS - Desbloquea el audio tras primer toque del usuario */
    document.addEventListener('touchstart', desbloquearAudioIOS, { once: true });
    document.addEventListener('click', desbloquearAudioIOS, { once: true });
}

/* DESBLOQUEAR AUDIO IOS - Del primer toque - Resuelve la restriccion de autoplay en Safari */
function desbloquearAudioIOS() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const CtxClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new CtxClass();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.close();
    }
}

/* SALTAR CANCION PLAYLIST - De los controles del sistema - Salta hacia adelante o atras */
function saltarCancionPlaylist(direccion) {
    if (!reproductiendoPlaylist || playlistActivaIndex < 0) return;
    const lista = arrayPlaylists[playlistActivaIndex].canciones;
    if (!lista || lista.length === 0) return;
    let nuevo = indicePlaylistActual + direccion;
    if (nuevo < 0) nuevo = lista.length - 1;
    if (nuevo >= lista.length) nuevo = 0;
    reproducirCancionDePlaylist(nuevo);
}

/* ==========================================
   MODO OFFLINE - Bloqueo de funciones sin red
   ========================================== */

/* EVENTOS DE RED - Del sistema - Detecta perdida o recuperacion de conexion */
window.addEventListener('offline', () => {
    document.getElementById('banner-offline').classList.add('visible');
    document.getElementById('input-url-musica').disabled = true;
    cambiarVista('vista-historial');
    cambiarTab('guardados');
    mostrarToast("Sin conexion. Solo puedes ver Guardados y Playlists.");
});

window.addEventListener('online', () => {
    document.getElementById('banner-offline').classList.remove('visible');
    document.getElementById('input-url-musica').disabled = false;
    mostrarToast("Conexion recuperada. Ya puedes buscar musica!");
});

/* ==========================================
   TOAST - Sistema de notificaciones internas
   ========================================== */
let timerToast;

/* MOSTRAR TOAST - Global - Reemplaza los alerts del navegador por un mensaje flotante */
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast-notificacion');
    toast.innerText = mensaje;
    toast.classList.remove('toast-oculto');
    toast.classList.add('toast-visible');
    clearTimeout(timerToast);
    timerToast = setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-oculto');
    }, 3000);
}

/* CERRAR MODAL - Global - Oculta cualquier ventana interna de confirmacion */
function cerrarModal(idModal) {
    document.getElementById(idModal).classList.add('vista-oculta');
}

/* ==========================================
   NAVEGACION - Sistema de vistas
   ========================================== */

/* CAMBIAR VISTA - De la navegacion - Muestra solo la seccion seleccionada y oculta el resto */
function cambiarVista(idVista) {
    ['vista-inicio', 'vista-historial', 'vista-reproductor', 'vista-perfil'].forEach(v => {
        const div = document.getElementById(v);
        if (div) { div.classList.remove('vista-activa'); div.classList.add('vista-oculta'); }
    });
    const activa = document.getElementById(idVista);
    if (activa) { activa.classList.remove('vista-oculta'); activa.classList.add('vista-activa'); }
    const menuEnlace = document.getElementById('menu-enlaces');
    const btnHamburguesa = document.getElementById('btn-hamburguesa');
    if (menuEnlace.classList.contains('activo')) {
        menuEnlace.classList.remove('activo');
        btnHamburguesa.classList.remove('activo');
    }
}

/* ALTERNAR MENU - Del hamburguesa mobile - Abre o cierra el menu lateral en pantallas pequeñas */
function alternarMenu() {
    document.getElementById('menu-enlaces').classList.toggle('activo');
    document.getElementById('btn-hamburguesa').classList.toggle('activo');
}

/* ==========================================
   PERSISTENCIA LOCAL - Arrays en localStorage
   ========================================== */
let arrayHistorial = [];
let arrayGuardados = [];
let arrayPlaylists = [];
let playlistActivaIndex = -1;
let cancionActualGlobal = null;

/* CARGAR DATOS - Al loguear - Rescata los arrays guardados en el dispositivo del usuario */
function cargarDatosLocales() {
    const hist = localStorage.getItem(`somnium_hist_${idUsuario}`);
    const guar = localStorage.getItem(`somnium_guar_${idUsuario}`);
    const play = localStorage.getItem(`somnium_play_${idUsuario}`);
    if (hist) arrayHistorial = JSON.parse(hist);
    if (guar) arrayGuardados = JSON.parse(guar);
    if (play) arrayPlaylists = JSON.parse(play);
    renderizarHistorial();
    renderizarGuardados();
    renderizarCuadriculaPlaylists();
}

/* SINCRONIZAR DATOS - Tras cada accion - Guarda los arrays actualizados en el dispositivo */
function sincronizarDatosLocales() {
    localStorage.setItem(`somnium_hist_${idUsuario}`, JSON.stringify(arrayHistorial));
    localStorage.setItem(`somnium_guar_${idUsuario}`, JSON.stringify(arrayGuardados));
    localStorage.setItem(`somnium_play_${idUsuario}`, JSON.stringify(arrayPlaylists));
}

/* ==========================================
   MOTOR YOUTUBE API - Audio real via iframe oculto
   ========================================== */
let playerYT;
let ytListo = false;

/* INICIAR YOUTUBE - API externa - Crea el iframe invisible que reproduce el audio de YouTube */
function onYouTubeIframeAPIReady() {
    playerYT = new YT.Player('yt-player-container', {
        height: '1', width: '1', videoId: '',
        playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
        events: {
            'onReady': () => { ytListo = true; },
            'onStateChange': onPlayerStateChange
        }
    });
}

/* EXTRAER ID VIDEO - Del link de YouTube - Saca el codigo unico de 11 caracteres del video */
function extraerIDVideo(url) {
    const r = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(r);
    return (match && match[2].length === 11) ? match[2] : null;
}

/* BUSCAR CANCION - Del input de URL - Obtiene metadata de noembed y arranca la reproduccion */
function buscarCancion() {
    if (!ytListo) { mostrarToast("El reproductor aun esta cargando, espera."); return; }
    if (!navigator.onLine) { mostrarToast("Sin conexion. No puedes buscar canciones."); return; }
    const url = document.getElementById('input-url-musica').value.trim();
    const videoId = extraerIDVideo(url);
    if (!videoId) { mostrarToast("Inserta un link de YouTube valido."); return; }

    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
    .then(res => res.json())
    .then(data => {
        const titulo = data.title || "Audio YouTube";
        const artista = data.author_name || "Artista";
        const imagen = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        cancionActualGlobal = { id: videoId, titulo, artista, portada: imagen };

        /* PINTAR REPRODUCTOR INICIO - Vista inicio - Muestra portada titulo y artista */
        document.getElementById('tarjeta-reproductor').style.display = 'flex';
        document.getElementById('titulo-cancion-inicio').innerText = titulo;
        document.getElementById('artista-cancion-inicio').innerText = artista;
        document.getElementById('portada-cancion-inicio').src = imagen;

        playerYT.loadVideoById(videoId);
        detenerReproduccionPlaylist();

        /* OCULTAR TUTORIAL - Al buscar - Esconde la guia cuando ya hay cancion activa */
        const tutorial = document.getElementById('caja-tutorial');
        if (tutorial) tutorial.style.display = 'none';

        arrayHistorial.push(cancionActualGlobal);
        sincronizarDatosLocales();
        renderizarHistorial();
        actualizarMediaSession(titulo, artista, imagen);
    })
    .catch(() => { mostrarToast("Error al obtener info del video."); });
}

/* ACTUALIZAR MEDIA SESSION - Del sistema operativo - Actualiza nombre portada y artista en pantalla de bloqueo */
function actualizarMediaSession(titulo, artista, imagen) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: titulo, artist: artista,
        artwork: [{ src: imagen, sizes: '512x512', type: 'image/jpeg' }]
    });
}

/* REPRODUCIR EN LISTA - De historial o guardados - Reproduce la pista sin salir de la vista actual */
function reproducirEnLista(videoId, titulo, artista, imagen) {
    if (!ytListo) { mostrarToast("El reproductor aun esta cargando."); return; }
    if (!navigator.onLine) { mostrarToast("Sin conexion para reproducir."); return; }

    /* MISMA CANCION - Si ya suena - Solo alterna play y pause sin recargar el video */
    if (cancionActualGlobal && cancionActualGlobal.id === videoId) {
        alternarReproduccion();
        return;
    }

    cancionActualGlobal = { id: videoId, titulo, artista, portada: imagen };
    detenerReproduccionPlaylist();

    /* ACTUALIZAR REPRODUCTOR INICIO - En background - Refleja la cancion aunque no se cambie de vista */
    document.getElementById('tarjeta-reproductor').style.display = 'flex';
    document.getElementById('titulo-cancion-inicio').innerText = titulo;
    document.getElementById('artista-cancion-inicio').innerText = artista;
    document.getElementById('portada-cancion-inicio').src = imagen;

    playerYT.loadVideoById(videoId);
    actualizarMediaSession(titulo, artista, imagen);
    mostrarToast('▶ ' + titulo);
}

/* ALTERNAR REPRODUCCION - Boton play pause global - Controla el estado actual del motor de YouTube */
function alternarReproduccion() {
    if (!playerYT || !ytListo) return;
    const estado = playerYT.getPlayerState();
    if (estado === YT.PlayerState.PLAYING) { playerYT.pauseVideo(); }
    else { playerYT.playVideo(); }
}

/* ACTUALIZAR BOTONES PLAY - Global - Sincroniza el icono en todos los botones play pause */
function actualizarBotonesPlay(icono) {
    const ids = ['btn-play-pause', 'btn-play-playlist'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerText = icono; });

    /* BOTONES EN LISTAS - Historial y guardados - Actualiza el boton de la cancion activa */
    if (cancionActualGlobal) {
        const btnHist = document.getElementById('btn-hist-' + cancionActualGlobal.id);
        const btnGuar = document.getElementById('btn-guar-' + cancionActualGlobal.id);
        if (btnHist) btnHist.innerText = icono;
        if (btnGuar) btnGuar.innerText = icono;
    }
}

let intervaloProgreso;

/* CAMBIO DE ESTADO YOUTUBE - Del motor YT - Reacciona a play pausa y fin de video */
function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
        actualizarBotonesPlay('⏸');
        clearInterval(intervaloProgreso);
        intervaloProgreso = setInterval(actualizarBarrasYT, 500);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else if (e.data === YT.PlayerState.PAUSED) {
        actualizarBotonesPlay('▶');
        clearInterval(intervaloProgreso);
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    } else if (e.data === YT.PlayerState.ENDED) {
        actualizarBotonesPlay('▶');
        clearInterval(intervaloProgreso);
        manejarFinCancion();
    }
}

/* ACTUALIZAR BARRAS YT - Cada 500ms - Mueve el slider y tiempo en todos los reproductores activos */
function actualizarBarrasYT() {
    if (!playerYT || !ytListo) return;
    const actual = playerYT.getCurrentTime() || 0;
    const total = playerYT.getDuration() || 0;

    /* BARRA REPRODUCTOR INICIO - Del slider principal - Actualiza tiempo y posicion */
    const barraInicio = document.getElementById('barra-progreso-inicio');
    if (barraInicio) { barraInicio.max = Math.floor(total); barraInicio.value = Math.floor(actual); }
    const tActual = document.getElementById('tiempo-actual');
    const tTotal = document.getElementById('tiempo-total');
    if (tActual) tActual.innerText = formatearTiempo(actual);
    if (tTotal) tTotal.innerText = formatearTiempo(total);

    /* BARRA MINI PLAYLIST - Del mini reproductor de playlist - Actualiza tiempo y posicion */
    const barraPlaylist = document.getElementById('mini-barra-progreso');
    if (barraPlaylist) { barraPlaylist.max = Math.floor(total); barraPlaylist.value = Math.floor(actual); }
    const mActual = document.getElementById('mini-tiempo-actual');
    const mTotal = document.getElementById('mini-tiempo-total');
    if (mActual) mActual.innerText = formatearTiempo(actual);
    if (mTotal) mTotal.innerText = formatearTiempo(total);

    /* BARRAS EN LISTAS - De historial y guardados - Actualiza la barra de la cancion activa */
    if (cancionActualGlobal) {
        const barraHist = document.getElementById('barra-hist-' + cancionActualGlobal.id);
        const barraGuar = document.getElementById('barra-guar-' + cancionActualGlobal.id);
        const tHistA = document.getElementById('thist-a-' + cancionActualGlobal.id);
        const tHistT = document.getElementById('thist-t-' + cancionActualGlobal.id);
        const tGuarA = document.getElementById('tguar-a-' + cancionActualGlobal.id);
        const tGuarT = document.getElementById('tguar-t-' + cancionActualGlobal.id);
        if (barraHist) { barraHist.max = Math.floor(total); barraHist.value = Math.floor(actual); }
        if (barraGuar) { barraGuar.max = Math.floor(total); barraGuar.value = Math.floor(actual); }
        if (tHistA) tHistA.innerText = formatearTiempo(actual);
        if (tHistT) tHistT.innerText = formatearTiempo(total);
        if (tGuarA) tGuarA.innerText = formatearTiempo(actual);
        if (tGuarT) tGuarT.innerText = formatearTiempo(total);
    }
}

/* EVENTO BARRA INICIO - Del slider principal - Al moverlo salta al tiempo indicado en el video */
document.getElementById('barra-progreso-inicio').addEventListener('input', (e) => {
    if (playerYT && ytListo) playerYT.seekTo(Number(e.target.value), true);
});

/* FORMATEAR TIEMPO - Utilidad - Convierte segundos en formato mm:ss legible */
function formatearTiempo(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const seg = Math.floor(s % 60);
    return `${m}:${seg < 10 ? '0' : ''}${seg}`;
}

/* ==========================================
   DESCARGA DE VIDEO - Video real con portada animada
   ========================================== */

/* DESCARGAR CANCION - Boton descargar de cualquier lista - Genera un video WebM con portada y titulo */
function descargarCancion(cancion) {
    if (!cancion) { mostrarToast("No hay cancion para descargar."); return; }

    /* VERIFICAR SOPORTE - Del navegador - MediaRecorder y captureStream son necesarios */
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        mostrarToast("Tu navegador no soporta descarga de video. Usa Chrome o Edge.");
        return;
    }

    mostrarToast("Preparando descarga, espera...");

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = "anonymous";

    /* COMENZAR GRABACION - Del canvas - Inicia la captura del canvas como stream de video */
    function iniciarGrabacion() {
        /* ANIMAR CANVAS - De la grabacion - requestAnimationFrame mantiene el stream activo con frames reales */
        let rafId;
        const tamPortada = 460;
        const xPortada = (1280 - tamPortada) / 2;
        const yPortada = (720 - tamPortada) / 2 - 50;
        const tituloCorto = cancion.titulo.length > 52 ? cancion.titulo.substring(0, 52) + '...' : cancion.titulo;
        let angulo = 0;
        let tiempoInicio = Date.now();
        const duracionMs = 180000;

        function dibujarFrame() {
            const transcurrido = Date.now() - tiempoInicio;

            /* FONDO DEGRADADO - Del frame - Fondo animado con tono cambiante */
            const gradiente = ctx.createLinearGradient(0, 0, 1280, 720);
            const pulso = Math.sin(transcurrido / 3000) * 0.5 + 0.5;
            gradiente.addColorStop(0, `hsl(${220 + pulso * 20}, 80%, 8%)`);
            gradiente.addColorStop(1, `hsl(${250 + pulso * 15}, 70%, 5%)`);
            ctx.fillStyle = gradiente;
            ctx.fillRect(0, 0, 1280, 720);

            /* HALO PULSANTE - Detras de la portada - Circulo de luz azul animado */
            ctx.save();
            ctx.globalAlpha = 0.18 + pulso * 0.12;
            const radioHalo = tamPortada * 0.6 + pulso * 30;
            const cx = xPortada + tamPortada / 2;
            const cy = yPortada + tamPortada / 2;
            const gradHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radioHalo);
            gradHalo.addColorStop(0, '#4886e6');
            gradHalo.addColorStop(1, 'transparent');
            ctx.fillStyle = gradHalo;
            ctx.beginPath();
            ctx.arc(cx, cy, radioHalo, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            /* SOMBRA PORTADA - Detras de la imagen - Sombra difuminada bajo el album */
            ctx.save();
            ctx.shadowColor = 'rgba(72,134,230,0.5)';
            ctx.shadowBlur = 40;
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(xPortada, yPortada, tamPortada, tamPortada);
            ctx.restore();

            /* DIBUJAR PORTADA - Del frame - Imagen del album centrada con bordes redondeados */
            ctx.save();
            ctx.beginPath();
            const radio = 18;
            ctx.moveTo(xPortada + radio, yPortada);
            ctx.lineTo(xPortada + tamPortada - radio, yPortada);
            ctx.quadraticCurveTo(xPortada + tamPortada, yPortada, xPortada + tamPortada, yPortada + radio);
            ctx.lineTo(xPortada + tamPortada, yPortada + tamPortada - radio);
            ctx.quadraticCurveTo(xPortada + tamPortada, yPortada + tamPortada, xPortada + tamPortada - radio, yPortada + tamPortada);
            ctx.lineTo(xPortada + radio, yPortada + tamPortada);
            ctx.quadraticCurveTo(xPortada, yPortada + tamPortada, xPortada, yPortada + tamPortada - radio);
            ctx.lineTo(xPortada, yPortada + radio);
            ctx.quadraticCurveTo(xPortada, yPortada, xPortada + radio, yPortada);
            ctx.closePath();
            ctx.clip();
            if (img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, xPortada, yPortada, tamPortada, tamPortada);
            } else {
                ctx.fillStyle = '#1a0050';
                ctx.fillRect(xPortada, yPortada, tamPortada, tamPortada);
            }
            ctx.restore();

            /* BARRA INFERIOR - Del frame - Franja semitransparente para el texto */
            ctx.save();
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 630, 1280, 90);
            ctx.restore();

            /* TITULO CANCION - Del frame - Nombre de la cancion en blanco sobre la barra */
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 34px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(tituloCorto, 640, 668);

            /* ARTISTA CANCION - Del frame - Nombre del artista en azul debajo del titulo */
            ctx.fillStyle = '#4886e6';
            ctx.font = '24px sans-serif';
            ctx.fillText(cancion.artista, 640, 704);

            /* MARCA SOMNIUM - Del frame - Logo de texto en esquina superior derecha */
            ctx.fillStyle = 'rgba(99,75,218,0.7)';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('somnium', 1260, 36);

            /* ONDAS MUSICALES - Del frame - Barras animadas en la parte inferior izquierda */
            const numBarras = 6;
            const xBase = 40;
            const yBase = 690;
            for (let i = 0; i < numBarras; i++) {
                const altura = 10 + Math.abs(Math.sin(transcurrido / 300 + i * 0.8)) * 22;
                ctx.fillStyle = '#634bda';
                ctx.globalAlpha = 0.85;
                ctx.fillRect(xBase + i * 14, yBase - altura, 8, altura);
                ctx.globalAlpha = 1;
            }

            angulo += 0.005;
            if (Date.now() - tiempoInicio < duracionMs) {
                rafId = requestAnimationFrame(dibujarFrame);
            }
        }

        /* CONFIGURAR STREAM - De MediaRecorder - Captura el canvas como stream de video real */
        const stream = canvas.captureStream(30);
        const tiposMime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        let tipoElegido = '';
        for (const tipo of tiposMime) {
            if (MediaRecorder.isTypeSupported(tipo)) { tipoElegido = tipo; break; }
        }
        if (!tipoElegido) { mostrarToast("Tu navegador no soporta grabacion de video."); return; }

        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: tipoElegido, videoBitsPerSecond: 2500000 });

        recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
            cancelAnimationFrame(rafId);
            const blob = new Blob(chunks, { type: tipoElegido.split(';')[0] });
            const urlBlob = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlBlob;
            const nombreLimpio = cancion.titulo.replace(/[^a-z0-9\s\-_]/gi, '').trim() || 'somnium-track';
            a.download = nombreLimpio + '.webm';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(urlBlob);
            mostrarToast("Descarga completada!");
        };

        /* INICIAR RAF Y RECORDER - De la grabacion - Arranca los frames antes de iniciar el recorder */
        dibujarFrame();
        recorder.start(100);

        /* DURACION DESCARGA - De la grabacion - 3 segundos de vista previa visual del album */
        const duracionDescarga = 3000;
        setTimeout(() => {
            recorder.stop();
            stream.getTracks().forEach(t => t.stop());
        }, duracionDescarga);

        mostrarToast("Generando video... (3 segundos)");
    }

    img.onload = () => { iniciarGrabacion(); };
    img.onerror = () => {
        /* FALLBACK SIN PORTADA - Del error de imagen - Dibuja fondo de color si la imagen falla */
        iniciarGrabacion();
    };
    img.src = cancion.portada;
}

/* GUARDAR CANCION ACTUAL - Boton guardar - Mueve la cancion activa al array de Guardados */
function guardarCancionActual() {
    if (!cancionActualGlobal) { mostrarToast("No hay cancion activa."); return; }
    const existe = arrayGuardados.find(c => c.id === cancionActualGlobal.id);
    if (existe) { mostrarToast("Esta cancion ya esta guardada."); return; }
    arrayGuardados.push(cancionActualGlobal);
    sincronizarDatosLocales();
    renderizarGuardados();
    mostrarToast("Cancion guardada!");
}

/* ==========================================
   PLAYLIST AUTOPLAY - Motor de reproduccion secuencial
   ========================================== */
let modoPlaylist = 'normal';
let indicePlaylistActual = -1;
let reproductiendoPlaylist = false;
let indiceShuffleActual = -1;
let ordenShuffle = [];

/* MANEJAR FIN CANCION - Del motor YT - Decide que reproducir segun el modo seleccionado */
function manejarFinCancion() {
    if (!reproductiendoPlaylist || playlistActivaIndex < 0) return;
    const lista = arrayPlaylists[playlistActivaIndex].canciones;
    if (!lista || lista.length === 0) return;

    if (modoPlaylist === 'repetir') {
        reproducirCancionDePlaylist(indicePlaylistActual);
    } else if (modoPlaylist === 'normal') {
        const siguiente = indicePlaylistActual + 1;
        if (siguiente < lista.length) { reproducirCancionDePlaylist(siguiente); }
        else { detenerReproduccionPlaylist(); mostrarToast("Playlist finalizada."); }
    } else if (modoPlaylist === 'bucle') {
        reproducirCancionDePlaylist((indicePlaylistActual + 1) % lista.length);
    } else if (modoPlaylist === 'shuffle') {
        indiceShuffleActual++;
        if (indiceShuffleActual >= ordenShuffle.length) {
            ordenShuffle = mezclarArray([...Array(lista.length).keys()]);
            indiceShuffleActual = 0;
        }
        reproducirCancionDePlaylist(ordenShuffle[indiceShuffleActual]);
    }
}

/* MEZCLAR ARRAY - Utilidad - Algoritmo Fisher-Yates para orden aleatorio de pistas */
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* REPRODUCIR CANCION DE PLAYLIST - Del motor - Carga y reproduce la pista del indice indicado */
function reproducirCancionDePlaylist(indice) {
    if (playlistActivaIndex < 0) return;
    const lista = arrayPlaylists[playlistActivaIndex].canciones;
    if (!lista || indice < 0 || indice >= lista.length) return;

    /* MISMA CANCION - Si ya esta activa - Solo alterna play y pause sin recargar el video */
    if (indice === indicePlaylistActual && reproductiendoPlaylist) {
        alternarReproduccion();
        return;
    }

    const c = lista[indice];
    indicePlaylistActual = indice;
    reproductiendoPlaylist = true;
    cancionActualGlobal = { id: c.id, titulo: c.titulo, artista: c.artista, portada: c.portada };

    if (playerYT && ytListo) playerYT.loadVideoById(c.id);

    /* ACTUALIZAR MINI REPRODUCTOR - Del panel de playlist - Muestra info sin cambiar de vista */
    const miniReproductor = document.getElementById('mini-reproductor-playlist');
    const miniPortada = document.getElementById('mini-portada-playlist');
    const miniTitulo = document.getElementById('mini-titulo-playlist');
    const miniArtista = document.getElementById('mini-artista-playlist');
    if (miniReproductor) miniReproductor.style.display = 'flex';
    if (miniPortada) miniPortada.src = c.portada;
    if (miniTitulo) miniTitulo.innerText = c.titulo;
    if (miniArtista) miniArtista.innerText = c.artista;

    /* ACTUALIZAR REPRODUCTOR INICIO - En background - Para que coincida si el usuario navega a inicio */
    document.getElementById('tarjeta-reproductor').style.display = 'flex';
    document.getElementById('titulo-cancion-inicio').innerText = c.titulo;
    document.getElementById('artista-cancion-inicio').innerText = c.artista;
    document.getElementById('portada-cancion-inicio').src = c.portada;

    /* ESTADO VISUAL - Playlist activa - Punto pulsante con nombre de la pista que suena */
    const estadoEl = document.getElementById('estado-playlist');
    const labelEl = document.getElementById('label-estado-playlist');
    if (estadoEl && labelEl) { estadoEl.style.display = 'flex'; labelEl.innerText = c.titulo + ' — ' + c.artista; }

    actualizarMediaSession(c.titulo, c.artista, c.portada);
    renderizarCancionesPlaylistActual();
    mostrarToast('▶ ' + c.titulo);
}

/* DETENER REPRODUCCION PLAYLIST - Al buscar cancion nueva - Resetea el estado de la playlist activa */
function detenerReproduccionPlaylist() {
    reproductiendoPlaylist = false;
    indicePlaylistActual = -1;
    const estadoEl = document.getElementById('estado-playlist');
    if (estadoEl) estadoEl.style.display = 'none';
    const miniReproductor = document.getElementById('mini-reproductor-playlist');
    if (miniReproductor) miniReproductor.style.display = 'none';
}

/* CAMBIAR MODO PLAYLIST - Botones tipo Spotify - Alterna entre normal bucle shuffle y repetir */
function cambiarModoPlaylist(modo) {
    modoPlaylist = modo;
    ['normal', 'bucle', 'shuffle', 'repetir'].forEach(m => {
        const btn = document.getElementById('btn-modo-' + m);
        if (btn) btn.classList.remove('activo');
    });
    const btnActivo = document.getElementById('btn-modo-' + modo);
    if (btnActivo) btnActivo.classList.add('activo');
    if (modo === 'shuffle') {
        const lista = playlistActivaIndex >= 0 ? arrayPlaylists[playlistActivaIndex].canciones : [];
        ordenShuffle = mezclarArray([...Array(lista.length).keys()]);
        indiceShuffleActual = -1;
    }
    const etiquetas = { normal: 'Normal', bucle: 'Bucle', shuffle: 'Aleatorio', repetir: 'Repetir cancion' };
    mostrarToast('Modo: ' + etiquetas[modo]);
}

/* ==========================================
   HISTORIAL Y GUARDADOS - Logica de listas con barra propia
   ========================================== */

/* CAMBIAR TAB - Del historial - Alterna entre la pestaña de Guardados y la de Historial */
function cambiarTab(tab) {
    document.getElementById('tab-guardados').classList.remove('activa');
    document.getElementById('tab-historial').classList.remove('activa');
    document.getElementById('lista-guardados').className = 'contenedor-lista-oculta';
    document.getElementById('lista-historial-completo').className = 'contenedor-lista-oculta';
    if (tab === 'guardados') {
        document.getElementById('tab-guardados').classList.add('activa');
        document.getElementById('lista-guardados').className = 'contenedor-lista-activa';
    } else {
        document.getElementById('tab-historial').classList.add('activa');
        document.getElementById('lista-historial-completo').className = 'contenedor-lista-activa';
    }
}

/* ICONO PLAY SEGUN ESTADO - De cada boton - Devuelve play o pausa segun si esa cancion suena ahora */
function iconoPlayCancion(videoId) {
    if (cancionActualGlobal && cancionActualGlobal.id === videoId && playerYT && ytListo) {
        return playerYT.getPlayerState() === YT.PlayerState.PLAYING ? '⏸' : '▶';
    }
    return '▶';
}

/* RENDERIZAR HISTORIAL - Del array - Dibuja cada pista del historial con barra de progreso propia */
function renderizarHistorial() {
    const div = document.getElementById('contenido-historial');
    if (!div) return;
    div.innerHTML = "";
    arrayHistorial.slice().reverse().forEach((c, idxReverse) => {
        const index = arrayHistorial.length - 1 - idxReverse;
        const ts = c.titulo.replace(/'/g, "\\'");
        const as = c.artista.replace(/'/g, "\\'");
        const esActiva = cancionActualGlobal && cancionActualGlobal.id === c.id;
        const claseExtra = esActiva ? ' reproduciendo-ahora' : '';
        div.innerHTML += `
            <div class="fila-cancion${claseExtra}" id="fila-hist-${c.id}">
                <img src="${c.portada}" class="mini-portada" alt="portada">
                <div class="info-fila"><h4>${c.titulo}</h4><p>${c.artista}</p></div>
                <button class="btn-circular" style="width:35px;height:35px;min-width:35px;font-size:14px;" id="btn-hist-${c.id}" onclick="reproducirEnLista('${c.id}','${ts}','${as}','${c.portada}')">${iconoPlayCancion(c.id)}</button>
                <div class="controles-tiempo-mini">
                    <span class="tiempo-mini" id="thist-a-${c.id}">0:00</span>
                    <input type="range" id="barra-hist-${c.id}" value="0" step="1" onchange="if(cancionActualGlobal&&cancionActualGlobal.id==='${c.id}'&&playerYT&&ytListo)playerYT.seekTo(this.value,true)">
                    <span class="tiempo-mini" id="thist-t-${c.id}">0:00</span>
                </div>
                <button class="btn-secundario-mini" onclick="guardarDesdeLista(${index},'historial')">Guardar</button>
                <button class="btn-primario-mini" onclick="descargarCancion({id:'${c.id}',titulo:'${ts}',artista:'${as}',portada:'${c.portada}'})">Descargar</button>
                <button class="btn-cerrar" onclick="borrarElementoLista(${index},'historial')">✖</button>
            </div>
        `;
    });
}

/* RENDERIZAR GUARDADOS - Del array - Dibuja cada pista guardada con barra de progreso propia */
function renderizarGuardados() {
    const div = document.getElementById('lista-guardados');
    if (!div) return;
    div.innerHTML = "";
    arrayGuardados.slice().reverse().forEach((c, idxReverse) => {
        const index = arrayGuardados.length - 1 - idxReverse;
        const ts = c.titulo.replace(/'/g, "\\'");
        const as = c.artista.replace(/'/g, "\\'");
        const esActiva = cancionActualGlobal && cancionActualGlobal.id === c.id;
        const claseExtra = esActiva ? ' reproduciendo-ahora' : '';
        div.innerHTML += `
            <div class="fila-cancion${claseExtra}" id="fila-guar-${c.id}">
                <img src="${c.portada}" class="mini-portada" alt="portada">
                <div class="info-fila"><h4>${c.titulo}</h4><p>${c.artista}</p></div>
                <button class="btn-circular" style="width:35px;height:35px;min-width:35px;font-size:14px;" id="btn-guar-${c.id}" onclick="reproducirEnLista('${c.id}','${ts}','${as}','${c.portada}')">${iconoPlayCancion(c.id)}</button>
                <div class="controles-tiempo-mini">
                    <span class="tiempo-mini" id="tguar-a-${c.id}">0:00</span>
                    <input type="range" id="barra-guar-${c.id}" value="0" step="1" onchange="if(cancionActualGlobal&&cancionActualGlobal.id==='${c.id}'&&playerYT&&ytListo)playerYT.seekTo(this.value,true)">
                    <span class="tiempo-mini" id="tguar-t-${c.id}">0:00</span>
                </div>
                <button class="btn-primario-mini" onclick="descargarCancion({id:'${c.id}',titulo:'${ts}',artista:'${as}',portada:'${c.portada}'})">Descargar</button>
                <button class="btn-cerrar" onclick="borrarElementoLista(${index},'guardados')">✖</button>
            </div>
        `;
    });
}

/* GUARDAR DESDE LISTA - Del historial - Copia la pista del historial al array de Guardados */
function guardarDesdeLista(index, tipo) {
    const c = tipo === 'historial' ? arrayHistorial[index] : null;
    if (c && !arrayGuardados.find(g => g.id === c.id)) {
        arrayGuardados.push(c);
        sincronizarDatosLocales();
        renderizarGuardados();
        mostrarToast("Anadida a Guardados");
    } else {
        mostrarToast("Esta cancion ya esta en Guardados.");
    }
}

/* BORRAR ELEMENTO LISTA - De historial o guardados - Elimina la pista del array correspondiente */
function borrarElementoLista(index, tipo) {
    if (tipo === 'historial') arrayHistorial.splice(index, 1);
    if (tipo === 'guardados') arrayGuardados.splice(index, 1);
    sincronizarDatosLocales();
    renderizarHistorial();
    renderizarGuardados();
}

/* ABRIR MODAL HISTORIAL - Del boton de eliminar - Muestra la ventana de confirmacion antes de vaciar */
function abrirModalBorrarHistorial() {
    document.getElementById('modal-confirmacion-historial').classList.remove('vista-oculta');
}

/* VACIAR HISTORIAL - Tras confirmacion - Borra todos los elementos del historial y actualiza la vista */
function vaciarHistorial() {
    arrayHistorial = [];
    sincronizarDatosLocales();
    renderizarHistorial();
    cerrarModal('modal-confirmacion-historial');
    mostrarToast("Historial eliminado por completo.");
}

/* ==========================================
   PLAYLISTS - Gestion de listas de reproduccion
   ========================================== */

/* CREAR NUEVA PLAYLIST - Boton agregar - Inserta una playlist vacia con canciones propias */
function crearNuevaPlaylist() {
    arrayPlaylists.push({
        id: Date.now(),
        titulo: "Nueva Playlist " + (arrayPlaylists.length + 1),
        portada: "fondo_inicio.png",
        canciones: []
    });
    sincronizarDatosLocales();
    renderizarCuadriculaPlaylists();
}

/* RENDERIZAR CUADRICULA - Del array de playlists - Dibuja las tarjetas en la grilla principal */
function renderizarCuadriculaPlaylists() {
    const div = document.getElementById('grilla-playlists');
    if (!div) return;
    div.innerHTML = "";
    arrayPlaylists.forEach((play, index) => {
        div.innerHTML += `
            <div class="tarjeta-playlist" onclick="abrirDetallePlaylist(${index})">
                <img src="${play.portada}" style="width:100%;aspect-ratio:1;border-radius:4px;margin-bottom:10px;object-fit:cover;" alt="portada">
                <h4 style="margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${play.titulo}</h4>
                <p style="color:#4886e6;font-size:14px;">${play.canciones.length} canciones</p>
            </div>
        `;
    });
}

/* ABRIR DETALLE PLAYLIST - Al hacer click en tarjeta - Muestra la lista de pistas de esa playlist */
function abrirDetallePlaylist(indexPlaylist) {
    playlistActivaIndex = indexPlaylist;
    const play = arrayPlaylists[indexPlaylist];
    document.getElementById('panel-cuadricula-playlists').style.display = 'none';
    document.getElementById('panel-detalle-playlist').style.display = 'block';
    document.getElementById('titulo-playlist-actual').innerText = play.titulo;
    document.getElementById('portada-playlist-actual').src = play.portada;
    document.getElementById('contador-canciones-playlist').innerText = play.canciones.length;

    /* RESETEAR MODO - Al abrir una playlist - Vuelve al modo normal por defecto */
    ['normal', 'bucle', 'shuffle', 'repetir'].forEach(m => {
        const btn = document.getElementById('btn-modo-' + m);
        if (btn) btn.classList.remove('activo');
    });
    const btnNormal = document.getElementById('btn-modo-normal');
    if (btnNormal) btnNormal.classList.add('activo');
    modoPlaylist = 'normal';

    /* MINI REPRODUCTOR - Al abrir playlist - Lo muestra si ya hay una pista sonando de esta lista */
    const miniReproductor = document.getElementById('mini-reproductor-playlist');
    if (miniReproductor) miniReproductor.style.display = reproductiendoPlaylist ? 'flex' : 'none';

    renderizarCancionesPlaylistActual();
}

/* GUARDAR CAMBIOS PLAYLIST - Al perder foco en el titulo - Persiste el nuevo nombre en localStorage */
function guardarCambiosPlaylist() {
    if (playlistActivaIndex < 0) return;
    arrayPlaylists[playlistActivaIndex].titulo = document.getElementById('titulo-playlist-actual').innerText;
    sincronizarDatosLocales();
    renderizarCuadriculaPlaylists();
    mostrarToast("Titulo guardado");
}

/* CAMBIAR PORTADA PLAYLIST - Al seleccionar un archivo - Actualiza la portada con imagen local */
function cambiarPortadaPlaylist(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const nuevaImagen = e.target.result;
        document.getElementById('portada-playlist-actual').src = nuevaImagen;
        arrayPlaylists[playlistActivaIndex].portada = nuevaImagen;
        sincronizarDatosLocales();
        renderizarCuadriculaPlaylists();
        mostrarToast("Portada actualizada");
    };
    reader.readAsDataURL(file);
}

/* BORRAR PLAYLIST ACTUAL - Boton eliminar - Suprime la playlist del array y regresa a la grilla */
function borrarPlaylistActual() {
    arrayPlaylists.splice(playlistActivaIndex, 1);
    sincronizarDatosLocales();
    renderizarCuadriculaPlaylists();
    volverAPlaylists();
    mostrarToast("Playlist eliminada");
}

/* VOLVER A PLAYLISTS - Boton volver - Oculta el panel de detalle y muestra la grilla de tarjetas */
function volverAPlaylists() {
    document.getElementById('panel-detalle-playlist').style.display = 'none';
    document.getElementById('panel-cuadricula-playlists').style.display = 'block';
    playlistActivaIndex = -1;
}

/* ABRIR MODAL SELECCION - Boton añadir cancion - Lista las canciones de Guardados para elegir */
function abrirModalSeleccionCancion() {
    const div = document.getElementById('contenedor-seleccion-guardados');
    div.innerHTML = "";
    if (arrayGuardados.length === 0) {
        div.innerHTML = "<p style='color:#ffffff;text-align:center;padding:20px;'>No hay canciones en Guardados.</p>";
    } else {
        arrayGuardados.forEach((c, index) => {
            div.innerHTML += `
                <div class="fila-cancion-seleccion" onclick="insertarCancionEnPlaylist(${index})">
                    <img src="${c.portada}" class="mini-portada" alt="portada">
                    <div class="info-fila"><h4>${c.titulo}</h4><p>${c.artista}</p></div>
                </div>
            `;
        });
    }
    document.getElementById('modal-seleccionar-guardados').classList.remove('vista-oculta');
}

/* INSERTAR CANCION EN PLAYLIST - Del modal - Copia la pista seleccionada a la playlist activa */
function insertarCancionEnPlaylist(indexGuardado) {
    /* COPIAR COMO OBJETO NUEVO - Del guardado - Evita referencias compartidas entre playlists */
    const origen = arrayGuardados[indexGuardado];
    const copia = { id: origen.id, titulo: origen.titulo, artista: origen.artista, portada: origen.portada };
    arrayPlaylists[playlistActivaIndex].canciones.push(copia);
    sincronizarDatosLocales();
    document.getElementById('contador-canciones-playlist').innerText = arrayPlaylists[playlistActivaIndex].canciones.length;
    renderizarCancionesPlaylistActual();
    cerrarModal('modal-seleccionar-guardados');
    mostrarToast("Cancion anadida a la Playlist");
}

/* RENDERIZAR CANCIONES PLAYLIST - Del panel de detalle - Dibuja cada pista con controles y resalta la activa */
function renderizarCancionesPlaylistActual() {
    const div = document.getElementById('lista-canciones-playlist');
    if (!div || playlistActivaIndex < 0) return;
    div.innerHTML = "";

    /* TOMAR CANCIONES DE LA PLAYLIST PROPIA - Del indice - Muestra solo las de esta lista, no de otras */
    const listaArr = arrayPlaylists[playlistActivaIndex].canciones;
    listaArr.forEach((c, index) => {
        const estaReproduciendo = reproductiendoPlaylist && indicePlaylistActual === index;
        const clase = estaReproduciendo ? 'fila-cancion reproduciendo-ahora' : 'fila-cancion';
        const ts = c.titulo.replace(/'/g, "\\'");
        const as = c.artista.replace(/'/g, "\\'");
        const iconoBtn = (estaReproduciendo && playerYT && ytListo && playerYT.getPlayerState() === YT.PlayerState.PLAYING) ? '⏸' : '▶';
        div.innerHTML += `
            <div class="${clase}">
                <img src="${c.portada}" class="mini-portada" alt="portada">
                <div class="info-fila"><h4>${c.titulo}</h4><p>${c.artista}</p></div>
                <button class="btn-circular" style="width:35px;height:35px;min-width:35px;font-size:14px;" onclick="reproducirCancionDePlaylist(${index})">${iconoBtn}</button>
                <button class="btn-primario-mini" onclick="descargarCancion({id:'${c.id}',titulo:'${ts}',artista:'${as}',portada:'${c.portada}'})">Descargar</button>
                <button class="btn-cerrar" onclick="borrarCancionPlaylist(${index})">✖</button>
            </div>
        `;
    });
}

/* BORRAR CANCION PLAYLIST - Del icono X - Elimina esa pista de la playlist activa y actualiza la vista */
function borrarCancionPlaylist(indexCancion) {
    arrayPlaylists[playlistActivaIndex].canciones.splice(indexCancion, 1);
    sincronizarDatosLocales();
    document.getElementById('contador-canciones-playlist').innerText = arrayPlaylists[playlistActivaIndex].canciones.length;
    renderizarCancionesPlaylistActual();
}

/* EVENTO BARRA MINI PLAYLIST - Del slider interno - Al moverlo salta al tiempo en la pista activa */
document.addEventListener('DOMContentLoaded', () => {
    const barraMini = document.getElementById('mini-barra-progreso');
    if (barraMini) {
        barraMini.addEventListener('input', (e) => {
            if (playerYT && ytListo) playerYT.seekTo(Number(e.target.value), true);
        });
    }
});

/* ==========================================
   PERFIL Y CUENTA - Datos del usuario
   ========================================== */

/* ACTUALIZAR NOMBRE - Al perder foco en el input - Guarda el nombre nuevo en Firebase */
function actualizarNombreFirebase() {
    const nuevo = document.getElementById('perfil-nombre').value;
    if (usuarioActual) {
        usuarioActual.updateProfile({ displayName: nuevo }).then(() => {
            mostrarToast('Nombre guardado automaticamente');
        });
    }
}

/* CERRAR SESION - Boton del perfil - Sale de Firebase y redirige a la pagina de login */
function cerrarSesion() {
    auth.signOut().then(() => { window.location.href = "index.html"; });
}

/* ==========================================
   MODAL ELIMINAR CUENTA - Con codigo visual en pantalla
   ========================================== */
let codigoBajaTemporal = "";

/* ABRIR MODAL ELIMINAR CUENTA - Del boton de peligro - Genera codigo aleatorio y muestra la advertencia */
function abrirModalEliminarCuenta() {
    codigoBajaTemporal = Math.floor(100000 + Math.random() * 900000).toString();
    document.getElementById('codigo-baja-visual').innerText = codigoBajaTemporal.split('').join(' ');
    document.getElementById('input-baja-pass').value = "";
    document.getElementById('input-baja-codigo').value = "";
    document.getElementById('modal-eliminar-cuenta').classList.remove('vista-oculta');
}

/* CONFIRMAR ELIMINACION CUENTA - Del boton rojo final - Verifica contrasena y codigo antes de borrar */
function confirmarEliminacionCuenta() {
    const pass = document.getElementById('input-baja-pass').value;
    const cod = document.getElementById('input-baja-codigo').value.trim();
    if (pass === "") { mostrarToast("Falta tu contrasena."); return; }
    if (cod !== codigoBajaTemporal) { mostrarToast("El codigo no coincide con el mostrado."); return; }
    if (usuarioActual) {
        usuarioActual.delete().then(() => {
            window.location.href = "index.html";
        }).catch(() => {
            mostrarToast("Error: vuelve a iniciar sesion y reintenta.");
        });
    }
}