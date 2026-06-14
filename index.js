/* INICIALIZACION FIREBASE - Del inicio del script - Para conectar con tu proyecto web */
const firebaseConfig = {
  apiKey: "AIzaSyDG9-c1arjZSzgKoOSYyKIknyKLImZOKV0",
  authDomain: "somnium-ca277.firebaseapp.com",
  projectId: "somnium-ca277",
  storageBucket: "somnium-ca277.firebasestorage.app",
  messagingSenderId: "422410883717",
  appId: "1:422410883717:web:028a21cea808e44c158fec",
  measurementId: "G-S4PT1F1PMM"
};

// COMPROBACION FIREBASE - Del sistema - Para evitar inicializar dos veces
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

/* INICIALIZACION EMAILJS - Del inicio del script - Para permitir el envio del codigo */
emailjs.init("eMH324lqDGDdLDZ7O");

// VARIABLES TEMPORALES - Del sistema de seguridad - Para almacenar codigos en memoria
let codigoTemporalRecuperacion = "";
let codigoTemporalRegistro = "";
// INTERVALO RELOJ - Del temporizador global - Para poder detener la cuenta regresiva
let intervaloReloj;

/* FUNCION AL CARGAR PÁGINA - Del inicio - Para verificar si el usuario estaba bloqueado previamente */
window.onload = function() {
    verificarBloqueoActivo();
};

/* FUNCION DE NAVEGACION - De todo el sistema - Para alternar los divs ocultos y activos */
function cambiarVista(idVista) {
    const todasLasVistas = [
        'vista-login',
        'vista-registro',
        'vista-codigo-registro',
        'vista-recuperar',
        'vista-codigo',
        'vista-nueva-pass',
        'vista-acerca',
        'vista-mensaje'
    ];

    todasLasVistas.forEach(vista => {
        const elemento = document.getElementById(vista);
        if (elemento) elemento.className = 'vista-oculta';
    });

    const vistaActiva = document.getElementById(idVista);
    if (vistaActiva) vistaActiva.className = 'vista-activa';

    // CIERRE MENU MOVIL - Al cambiar vista - Para ocultar el menu al seleccionar una opcion
    const menuEnlace = document.querySelector('.botones-navbar');
    const btnHamburguesa = document.getElementById('btn-hamburguesa');
    if (menuEnlace && btnHamburguesa) {
        menuEnlace.classList.remove('activo');
        btnHamburguesa.classList.remove('activo');
    }
}

/* FUNCIONES DE CONTRASEÑA - Del SVG del ojo - Para mostrar y ocultar */
function mostrarPass(idInput) { document.getElementById(idInput).type = "text"; }
function ocultarPass(idInput) { document.getElementById(idInput).type = "password"; }

/* ==========================================
   SECCIÓN DE REGISTRO (CON VERIFICACIÓN)
   ========================================== */

/* FUNCION PREPARAR REGISTRO - Del boton de registro inicial - Para validar datos y enviar correo */
function prepararRegistro() {
    const correo = document.getElementById('reg-correo').value;
    const pass = document.getElementById('reg-pass').value;
    const passConf = document.getElementById('reg-pass-conf').value;

    if (pass.length < 8) {
        mostrarMensaje("La contraseña debe tener al menos 8 caracteres.");
        return;
    }
    if (pass !== passConf) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }

    codigoTemporalRegistro = Math.floor(100000 + Math.random() * 900000).toString();
    const parametros = { email_destino: correo, codigo_generado: codigoTemporalRegistro };

    emailjs.send("service_6eclwyp", "template_pdhwc0x", parametros)
        .then(function(res) {
            cambiarVista('vista-codigo-registro');
        }, function(error) {
            console.error("ERROR EMAILJS (Registro):", error);
            mostrarMensaje("Error al enviar código. Revisa la consola.");
        });
}

/* FUNCION CONFIRMAR REGISTRO FINAL - De la pantalla codigo de registro - Para crear cuenta en Firebase */
function confirmarRegistroFinal() {
    const codigoEscrito = document.getElementById('codigo-registro-ingresado').value;
    const etiquetaError = document.getElementById('error-codigo-reg');

    if (codigoEscrito === codigoTemporalRegistro) {
        etiquetaError.style.display = "none";
        
        // PETICION FIREBASE - Del registro final - Ya validado el correo
        const correo = document.getElementById('reg-correo').value;
        const pass = document.getElementById('reg-pass').value;
        
        auth.createUserWithEmailAndPassword(correo, pass)
            .then((userCredential) => {
                mostrarMensaje("¡Cuenta creada y verificada con éxito!");
            })
            .catch((error) => {
                mostrarMensaje("Error en Firebase: " + error.message);
            });
    } else {
        etiquetaError.style.display = "block";
    }
}

/* ==========================================
   SECCIÓN DE LOGIN (CON BLOQUEO Y TIMER)
   ========================================== */

/* FUNCION INICIAR SESION - Del boton principal login - Para validar acceso en Firebase */
function iniciarSesion() {
    const correo = document.getElementById('login-correo').value;
    const pass = document.getElementById('login-pass').value;

    auth.signInWithEmailAndPassword(correo, pass)
        .then((userCredential) => {
            // REINICIO DE INTENTOS - Al entrar exitosamente - Limpia el historial de errores
            localStorage.setItem('intentosFallidos', 0);
            window.location.href = "principal.html";
        })
        .catch((error) => {
            manejarIntentoFallido();
        });
}

/* FUNCION MANEJAR INTENTO FALLIDO - De la seguridad - Para contar los errores y bloquear */
function manejarIntentoFallido() {
    let intentos = parseInt(localStorage.getItem('intentosFallidos')) || 0;
    intentos++;
    localStorage.setItem('intentosFallidos', intentos);

    if (intentos % 5 === 0) {
        // ACTIVAR BLOQUEO - Al llegar a 5 errores - Guarda la hora futura en localStorage
        const tiempoDesbloqueo = Date.now() + 60000; // 60 segundos
        localStorage.setItem('tiempoDesbloqueo', tiempoDesbloqueo);
        iniciarTemporizador(tiempoDesbloqueo);
    } else {
        mostrarMensaje("Credenciales incorrectas. Intento " + (intentos % 5) + " de 5.");
    }
}

/* FUNCION VERIFICAR BLOQUEO ACTIVO - Del on-load - Para mantener el castigo si recargan */
function verificarBloqueoActivo() {
    const tiempoDesbloqueo = localStorage.getItem('tiempoDesbloqueo');
    if (tiempoDesbloqueo && Date.now() < parseInt(tiempoDesbloqueo)) {
        iniciarTemporizador(parseInt(tiempoDesbloqueo));
    }
}

/* FUNCION INICIAR TEMPORIZADOR - Del bloqueo visual - Para actualizar el HTML cada segundo */
function iniciarTemporizador(tiempoDesbloqueo) {
    const btnLogin = document.getElementById('btn-login');
    const textoTimer = document.getElementById('texto-temporizador');
    
    btnLogin.disabled = true;
    textoTimer.style.display = "block";

    clearInterval(intervaloReloj); // LIMPIAR RELOJ - Por seguridad - Evita doble velocidad

    intervaloReloj = setInterval(() => {
        const tiempoRestante = Math.ceil((tiempoDesbloqueo - Date.now()) / 1000);
        
        if (tiempoRestante <= 0) {
            // LIBERAR BLOQUEO - Del temporizador - Cuando el tiempo acaba
            clearInterval(intervaloReloj);
            btnLogin.disabled = false;
            textoTimer.style.display = "none";
        } else {
            textoTimer.innerText = "Demasiados intentos. Espera " + tiempoRestante + " segundos.";
        }
    }, 1000);
}

/* ==========================================
   SECCIÓN DE RECUPERACIÓN DE CONTRASEÑA
   ========================================== */

/* FUNCION MANDAR CODIGO - Del boton recuperar - Para usar EmailJS y crear 6 digitos aleatorios */
function enviarCodigoRecuperacion() {
    const correo = document.getElementById('recuperar-correo').value;
    
    if (correo === "") {
        mostrarMensaje("Por favor, ingresa tu correo.");
        return;
    }

    codigoTemporalRecuperacion = Math.floor(100000 + Math.random() * 900000).toString();
    const parametros = { email_destino: correo, codigo_generado: codigoTemporalRecuperacion };

    emailjs.send("service_6eclwyp", "template_pdhwc0x", parametros)
        .then(function(res) {
            cambiarVista('vista-codigo');
        }, function(error) {
            // DEPURACION EMAILJS - Para el programador - Muestra el error exacto en consola
            console.error("ERROR EMAILJS (Recuperación):", error);
            mostrarMensaje("Error al enviar correo. Revisa la consola del navegador.");
        });
}

/* FUNCION REVISAR CODIGO RECUPERACION - De la pantalla codigo - Para validar si el numero es correcto */
function validarCodigo() {
    const codigoEscrito = document.getElementById('codigo-ingresado').value;
    const etiquetaError = document.getElementById('error-codigo');

    if (codigoEscrito === codigoTemporalRecuperacion) {
        etiquetaError.style.display = "none";
        cambiarVista('vista-nueva-pass');
    } else {
        etiquetaError.style.display = "block";
    }
}

/* FUNCION SOBREESCRIBIR CONTRASEÑA - Tras pasar el codigo - Para guardar la nueva credencial */
function guardarNuevaContrasena() {
    const nueva = document.getElementById('nueva-pass').value;
    const nuevaConf = document.getElementById('nueva-pass-conf').value;

    if (nueva.length < 8 || nueva !== nuevaConf) {
        mostrarMensaje("Revisa que las contraseñas coincidan y tengan 8 caracteres.");
        return;
    }

    mostrarMensaje("¡Contraseña restaurada con éxito!");
}

/* FUNCION MOSTRAR MENSAJE EMERGENTE - Para evitar popups del navegador - Controla una vista propia */
function mostrarMensaje(texto) {
    document.getElementById('texto-mensaje').innerText = texto;
    cambiarVista('vista-mensaje');
}

/* ==========================================
   SECCIÓN MENÚ MÓVIL (NUEVO)
   ========================================== */

/* FUNCION ALTERNAR MENU - Del boton hamburguesa - Para abrir o cerrar en moviles */
function alternarMenu() {
    const menuEnlace = document.querySelector('.botones-navbar');
    const btnHamburguesa = document.getElementById('btn-hamburguesa');
    
    if (menuEnlace && btnHamburguesa) {
        menuEnlace.classList.toggle('activo');
        btnHamburguesa.classList.toggle('activo');
    }
}

/* EVENTO CLIC EXTERNO - De la ventana - Para cerrar el menu si se toca en otra parte */
window.addEventListener('click', function(e) {
    const menuEnlace = document.querySelector('.botones-navbar');
    const btnHamburguesa = document.getElementById('btn-hamburguesa');
    
    if (menuEnlace && btnHamburguesa) {
        // Verifica si el clic ocurrió fuera del menú Y fuera del botón de hamburguesa
        if (!menuEnlace.contains(e.target) && !btnHamburguesa.contains(e.target)) {
            menuEnlace.classList.remove('activo');
            btnHamburguesa.classList.remove('activo');
        }
    }
});