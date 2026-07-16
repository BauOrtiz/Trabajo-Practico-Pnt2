<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Login from './views/Login.vue'
import { useAuthStore } from './stores/storeAuth'
import { obtenerPredicciones } from './services/prediccionesService'
import { calcularPuntosDesdePredicciones } from './services/puntosService'
import { useEstaticoStore } from './stores/storeEstaticos'

// --- ⚙️ 1. SERVICIOS Y CONEXIÓN DE STORES ---
const authStore = useAuthStore()         // Store global de autenticación (usuario actual, roles, login/logout)
const storeEstaticos = useEstaticoStore() // Store global para partidos del fixture mundialista
const router = useRouter()               // Enrutador global de Vue Router
const route = useRoute()                 // Objeto para leer propiedades de la ruta actual (query params)

// --- 📍 2. ESTADOS REACTIVOS LOCALES ---
const mostrarLogin = ref(false) // Controla la visibilidad del Modal de Login global
const mostrarMenu = ref(false)  // Controla la visibilidad del panel lateral flotante (Drawer de usuario)
const predicciones = ref([])    // Lista de predicciones personales del usuario logueado

// --- 🧭 3. GESTIÓN DE ENLACES DE NAVEGACIÓN (NAVBAR) ---

// Lista de rutas públicas fijas que se muestran en la barra superior principal
const linksBaseNavbar = [
  { to: '/home', label: 'Inicio' },
  { to: '/partidos', label: 'Partidos' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/prode', label: 'Prode' },
  { to: '/paises', label: 'Selecciones' },
  { to: '/estadios', label: 'Estadios' }
]

// linksMenu: Modifica dinámicamente los accesos del menú agregando la ruta '/perfil'
// únicamente si el usuario se encuentra con sesión iniciada.
const linksMenu = computed(() => {
  const links = [...linksBaseNavbar]

  if (authStore.isLoggedIn) {
    links.push({
      to: '/perfil',
      label: 'Perfil'
    })
  }

  return links
})

// nombreUsuario: Obtiene el identificador visible del usuario logueado.
// Prioriza el Nombre, de no existir usa el Email, y si no hay sesión iniciada devuelve 'Usuario'.
const nombreUsuario = computed(() => {
  return authStore.user?.nombre || authStore.user?.email || 'Usuario'
})

// puntosProde: ¡Lógica dinámica del Prode!
// Calcula reactivamente los puntos acumulados sumando los aciertos de las predicciones del usuario.
const puntosProde = computed(() => {
  const partidosFinalizados = (storeEstaticos.partidosConEstadoCalculado || [])
    .filter((partido) => partido.estado === 'finalizado')

  return calcularPuntosDesdePredicciones(predicciones.value, partidosFinalizados)
})

// --- 🔓 4. INTERFACES Y ACCIONES DE LOGIN/LOGOUT ---

/**
 * Invoca la apertura del Modal de Login global, cerrando preventivamente el menú lateral
 */
function abrirLogin() {
  cerrarMenu()
  mostrarLogin.value = true
}

/**
 * Cierra definitivamente el Modal de Login
 */
function cerrarLogin() {
  mostrarLogin.value = false
}

/**
 * Callback ejecutado si el usuario presiona "Registrarse" dentro del modal.
 * Como el modal de login tiene metida la lógica de redirección a la ruta /registro,
 * simplemente cerramos el modal actual para no superponer interfaces.
 */
function irARegistroDesdeLogin() {
  cerrarLogin()
}

// --- 👤 5. GESTIÓN DEL MENÚ LATERAL (DRAWER DE USUARIO) ---

/**
 * Abre el panel flotante de usuario, asegurándose de actualizar y recargar 
 * las apuestas guardadas para que los puntos se muestren siempre al día.
 */
async function abrirMenu() {
  cargarPredicciones()
  mostrarMenu.value = true
}

/**
 * Oculta el panel lateral del usuario
 */
function cerrarMenu() {
  mostrarMenu.value = false
}

/**
 * Limpia las credenciales de sesión en Pinia y cierra el panel lateral
 */
function cerrarSesion() {
  authStore.logout()
  cerrarMenu()
}

/**
 * Navega de forma programada a una ruta elegida desde el menú lateral y cierra el panel al finalizar
 */
function navegarDesdeMenu(ruta) {
  router.push(ruta)
  cerrarMenu()
}

/**
 * Consulta y sincroniza las apuestas guardadas en el LocalStorage del usuario
 */
function cargarPredicciones() {
  predicciones.value = obtenerPredicciones(authStore.user?.id)
}

/**
 * 🛡️ Capturador de Rutas Especiales:
 * Si una pantalla redirige al usuario con la instrucción `?login=1` en la URL (ej: al rebotar de /perfil),
 * esta función atrapa el parámetro, gatilla automáticamente el Modal de Login e inmediatamente
 * limpia la URL para remover el query param de manera prolija.
 */
function abrirLoginDesdeRuta() {
  if (route.query.login !== '1' || authStore.isLoggedIn) {
    return
  }

  mostrarLogin.value = true
  router.replace({ path: route.path, query: {} }) // Limpia el ?login=1 de la barra de navegación
}

// --- 👁️ 6. OBSERVADORES REACTIVOS (WATCHERS) ---

// watch(user.id): Si el ID del usuario cambia (es decir, el usuario inicia sesión de forma exitosa),
// actualiza las predicciones cargadas en el layout y cierra el modal de login de forma automática.
watch(
  () => authStore.user?.id,
  (usuarioId) => {
    cargarPredicciones()

    if (usuarioId) {
      cerrarLogin()
    }
  }
)

// watch(route.query.login): Vigilamos cambios en los parámetros de búsqueda de la URL para reaccionar
// de inmediato si se solicita el inicio de sesión desde un click externo.
watch(
  () => route.query.login,
  abrirLoginDesdeRuta
)

// --- 🚀 7. INICIALIZACIÓN ---
onMounted(async () => {
  await cargarPredicciones()     // Carga inicial de pronósticos guardados
  await abrirLoginDesdeRuta()    // Verifica si la app se cargó de entrada con la petición de Login activa
})
</script>

<template>
  <div class="app-layout">
    
    <!--  HEADER DE LA APLICACIÓN -->
    <header class="header">
      <!-- Botón flotante superior izquierdo (Ícono de Usuario) que despliega el Drawer del perfil -->
      <button
        type="button"
        class="menu-button"
        aria-label="Abrir usuario"
        @click="abrirMenu"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
          <path d="M4 20c.85-3.48 3.95-6 8-6s7.15 2.52 8 6" />
        </svg>
      </button>

      <!-- BARRA DE NAVEGACIÓN PRINCIPAL (NAVBAR) -->
      <nav class="navbar" aria-label="Navegacion principal">
        <!-- Renderiza los enlaces fijos de la navbar superior -->
        <router-link
          v-for="link in linksBaseNavbar"
          :key="link.to"
          :to="link.to"
        >
          {{ link.label }}
        </router-link>

        <!-- Acceso restringido visible únicamente si el usuario es Administrador -->
        <router-link v-if="authStore.isAdmin" to="/admin/calendario">
          Admin
        </router-link>

        <!-- Botón de Login rápido integrado si no se detecta sesión iniciada -->
        <button
          v-if="!authStore.isLoggedIn"
          type="button"
          class="login-nav-button"
          @click="abrirLogin"
        >
          LogIn
        </button>
      </nav>
    </header>

    <!-- 👥 MENÚ LATERAL DESPLIZABLE (DRAWER DE USUARIO) -->
    <div v-if="mostrarMenu" class="drawer-backdrop" @click.self="cerrarMenu">
      <aside class="side-menu" aria-label="Administracion del usuario">
        <div>
          <div class="side-menu-header">
            <h2>Usuario</h2>

            <!-- Cruz de cierre para plegar el menú lateral -->
            <button
              type="button"
              class="side-menu-close"
              aria-label="Cerrar menu"
              @click="cerrarMenu"
            >
              x
            </button>
          </div>

          <!-- SUBPANEL 1: Sesión Iniciada (Muestra Nombre, Rol y Puntos en tiempo real) -->
          <section v-if="authStore.isLoggedIn" class="user-summary">
            <p class="user-name">{{ nombreUsuario }}</p>
            <p class="user-role">{{ authStore.nombreRol }}</p>
            <p class="user-points">{{ puntosProde }} puntos</p>
          </section>

          <!-- SUBPANEL 2: Estado Anónimo (Si no hay credenciales activas) -->
          <section v-else class="user-summary">
            <p class="user-name">Sin sesion iniciada</p>
            <p class="user-points">0 puntos</p>
          </section>

          <!-- Links de navegación internos del menú lateral (Incluye perfil del usuario) -->
          <nav class="side-menu-links" aria-label="Navegacion lateral">
            <router-link
              v-for="link in linksMenu"
              :key="link.to"
              :to="link.to"
              @click.prevent="navegarDesdeMenu(link.to)"
            >
              {{ link.label }}
            </router-link>

            <!-- Acceso de administración duplicado en el menú lateral para comodidad -->
            <router-link
              v-if="authStore.isAdmin"
              to="/admin/calendario"
              @click.prevent="navegarDesdeMenu('/admin/calendario')"
            >
              Admin
            </router-link>
          </nav>
        </div>

        <!-- BOTÓN DE ACCIÓN INFERIOR DEL MENÚ -->
        <button
          v-if="authStore.isLoggedIn"
          type="button"
          class="logout-button"
          @click="cerrarSesion"
        >
          Cerrar sesion
        </button>

        <button
          v-else
          type="button"
          class="logout-button"
          @click="abrirLogin"
        >
          Iniciar sesion
        </button>
      </aside>
    </div>

    <!-- 🚀 CONTENEDOR DE LAS VISTAS DE LA APP (DÓNDE SE DIBUJA CADA PÁGINA) -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 🔑 MODAL DE INICIO DE SESIÓN GLOBAL -->
    <div v-if="mostrarLogin" class="modal-backdrop" @click.self="cerrarLogin">
      <section class="login-modal" aria-label="Inicio de sesión">
        <!-- Cruz de cierre para el modal -->
        <button
          type="button"
          class="modal-close"
          aria-label="Cerrar login"
          @click="cerrarLogin"
        >
          ×
        </button>

        <!-- 
          Inyectamos el componente de Login de forma modular. 
          Escucha el evento '@registrarse' para cerrar este modal y mandar al usuario a la vista de registro.
        -->
        <Login @registrarse="irARegistroDesdeLogin" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #111827;
}

.header {
  width: 100%;
  position: relative;
  z-index: 30;
  padding: 18px 20px 8px;
}

.menu-button {
  position: absolute;
  top: 26px;
  left: 20px;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #374151;
  border-radius: 10px;
  background: #1f2937;
  cursor: pointer;
}

.menu-button svg {
  width: 23px;
  height: 23px;
  fill: none;
  stroke: #93c5fd;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.menu-button:hover {
  background: #2563eb;
}

.menu-button:hover svg {
  stroke: white;
}

.navbar {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 18px;
  display: flex;
  justify-content: center;
  gap: 24px;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.navbar a,
.login-nav-button {
  color: #93c5fd;
  padding: 6px 10px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.login-nav-button {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}

.navbar a:hover,
.login-nav-button:hover {
  color: white;
  background-color: #2563eb;
}

.navbar a.router-link-active {
  color: white;
  background-color: #2563eb;
}

.main-content {
  width: 100%;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(5, 9, 20, 0.62);
}

.side-menu {
  width: min(82vw, 290px);
  min-height: 100%;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  background: #1f2937;
  border-right: 1px solid #374151;
  box-shadow: 18px 0 50px rgba(0, 0, 0, 0.35);
}

.side-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 22px;
}

.side-menu-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.user-summary {
  margin-bottom: 20px;
  padding: 14px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #111827;
}

.user-name {
  margin: 0 0 6px;
  color: white;
  font-size: 1rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.user-points {
  margin: 0;
  color: #93c5fd;
  font-size: 0.95rem;
  font-weight: 700;
}

.user-role {
  display: inline-flex;
  margin: 0 0 8px;
  padding: 3px 8px;
  border-radius: 999px;
  color: #dbeafe;
  background: #2563eb;
  font-size: 0.75rem;
  font-weight: 800;
}

.side-menu-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #d1d5db;
  background: #111827;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  line-height: 1;
  padding: 0;
}

.side-menu-close:hover {
  color: white;
  background: #2563eb;
}

.side-menu-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-menu-links a,
.logout-button {
  width: 100%;
  padding: 11px 12px;
  border-radius: 10px;
  color: #dbeafe;
  text-align: left;
  text-decoration: none;
  font: inherit;
  font-weight: 600;
}

.side-menu-links a:hover,
.side-menu-links a.router-link-active {
  color: white;
  background: #2563eb;
}

.logout-button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.logout-button:hover {
  color: #fecaca;
  background: #7f1d1d;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(5, 9, 20, 0.78);
  backdrop-filter: blur(6px);
}

.login-modal {
  position: relative;
  width: min(100%, 430px);
  padding: 30px;
  color: white;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  color: #d1d5db;
  background: #111827;
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 1;
}

.modal-close:hover {
  color: white;
  background: #2563eb;
}

.login-modal :deep(h1) {
  margin: 0 0 20px;
  color: white;
  font-size: 1.8rem;
  font-weight: 800;
}

.login-modal :deep(form) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-modal :deep(.form-group) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-modal :deep(label) {
  color: #e5e7eb;
  font-weight: 700;
}

.login-modal :deep(input) {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #4b5563;
  border-radius: 10px;
  color: white;
  background: #111827;
  font: inherit;
}

.login-modal :deep(input:focus) {
  outline: 2px solid #2563eb;
  border-color: #93c5fd;
}

.login-modal :deep(button[type='submit']) {
  margin-top: 4px;
  padding: 12px 14px;
  border: 0;
  border-radius: 10px;
  color: white;
  background: #2563eb;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.login-modal :deep(button[type='submit']:hover) {
  background: #1d4ed8;
}

.login-modal :deep(button[type='submit']:disabled) {
  cursor: wait;
  opacity: 0.7;
}

.login-modal :deep(a) {
  color: #93c5fd;
  cursor: pointer;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.login-modal :deep(a:hover) {
  color: white;
}

.login-modal :deep(.error-msg) {
  margin: 0;
  padding: 10px 12px;
  color: #fecaca;
  background: #7f1d1d;
  border-radius: 10px;
}

@media (max-width: 600px) {
  .navbar {
    flex-wrap: wrap;
    gap: 10px;
  }

  .login-modal {
    padding: 26px;
  }
}
</style>
