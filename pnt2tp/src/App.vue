<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Login from './views/Login.vue'
import { useAuthStore } from './stores/storeAuth'
import { obtenerPartidos } from './services/partidosService'
import { calcularPuntosProde } from './utils/puntuacionProde'

const authStore = useAuthStore()
const router = useRouter()
const mostrarLogin = ref(false)
const mostrarMenu = ref(false)
const partidos = ref([])
const predicciones = ref([])

// Lista de rutas que se muestran en el menu lateral y en la navbar oculta.
const linksNavbar = [
  { to: '/home', label: 'Inicio' },
  { to: '/partidos', label: 'Partidos' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/prode', label: 'Prode' },
  { to: '/paises', label: 'Selecciones' },
  { to: '/estadios', label: 'Estadios' }
]

// Muestra el nombre del usuario si existe; si no, usa el email o un texto generico.
const nombreUsuario = computed(() => {
  return authStore.user?.nombre || authStore.user?.email || 'Usuario'
})

// Calcula los puntos del usuario comparando sus predicciones contra resultados reales.
const puntosProde = computed(() => {
  return calcularPuntosProde(predicciones.value, partidos.value)
})

// Abre el modal de login y cierra el menu lateral si estaba abierto.
function abrirLogin() {
  cerrarMenu()
  mostrarLogin.value = true
}


function cerrarLogin() {
  mostrarLogin.value = false
}

// Abre el panel de usuario y actualiza predicciones/partidos antes de mostrarlo.
async function abrirMenu() {
  cargarPredicciones()
  await cargarPartidos()
  mostrarMenu.value = true
}

function cerrarMenu() {
  mostrarMenu.value = false
}

function cerrarSesion() {
  authStore.logout()
  cerrarMenu()
}

// Navega desde el menu lateral y despues cierra el panel.
function navegarDesdeMenu(ruta) {
  router.push(ruta)
  cerrarMenu()
}


function cargarPredicciones() {
  const prediccionesGuardadas = localStorage.getItem('predicciones')
  predicciones.value = prediccionesGuardadas ? JSON.parse(prediccionesGuardadas) : []
}

// Trae los partidos desde la API para poder calcular puntos reales del Prode.
async function cargarPartidos() {
  if (partidos.value.length > 0) return

  try {
    partidos.value = await obtenerPartidos()
  } catch (error) {
    partidos.value = []
  }
}

// Si el login fue correcto, cierra automaticamente el modal de login.
watch(
  () => authStore.isLoggedIn,
  (estaLogueado) => {
    if (estaLogueado) {
      cerrarLogin()
    }
  }
)

// Carga datos iniciales cuando se monta la app.
onMounted(async () => {
  cargarPredicciones()
  await cargarPartidos()
})
</script>

<template>
  <div class="app-layout">
    <header class="header">
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

      <!-- Navbar principal de la aplicacion. -->
      <nav class="navbar" aria-label="Navegacion principal">
        <router-link
          v-for="link in linksNavbar"
          :key="link.to"
          :to="link.to"
        >
          {{ link.label }}
        </router-link>

        <!-- Boton de login para la navbar original si el usuario no inicio sesion. -->
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

    <div v-if="mostrarMenu" class="drawer-backdrop" @click.self="cerrarMenu">
      <aside class="side-menu" aria-label="Administracion del usuario">
        <div>
          <div class="side-menu-header">
            <h2>Usuario</h2>

            <!-- Boton que cierra el panel lateral del usuario. -->
            <button
              type="button"
              class="side-menu-close"
              aria-label="Cerrar menu"
              @click="cerrarMenu"
            >
              x
            </button>
          </div>

          <!-- Datos del usuario logueado y puntos actuales del Prode. -->
          <section v-if="authStore.isLoggedIn" class="user-summary">
            <p class="user-name">{{ nombreUsuario }}</p>
            <p class="user-points">{{ puntosProde }} puntos</p>
          </section>

          <!-- Mensaje cuando todavia no hay usuario logueado. -->
          <section v-else class="user-summary">
            <p class="user-name">Sin sesion iniciada</p>
            <p class="user-points">0 puntos</p>
          </section>

          <!-- Links de navegacion dentro del panel lateral. -->
          <nav class="side-menu-links" aria-label="Navegacion lateral">
            <router-link
              v-for="link in linksNavbar"
              :key="link.to"
              :to="link.to"
              @click.prevent="navegarDesdeMenu(link.to)"
            >
              {{ link.label }}
            </router-link>
          </nav>
        </div>

        <!-- Boton para cerrar la sesion del usuario logueado. -->
        <button
          v-if="authStore.isLoggedIn"
          type="button"
          class="logout-button"
          @click="cerrarSesion"
        >
          Cerrar sesion
        </button>

        <!-- Boton para abrir el login cuando no hay sesion iniciada. -->
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

    <main class="main-content">
      <router-view />
    </main>

    <div v-if="mostrarLogin" class="modal-backdrop" @click.self="cerrarLogin">
      <section class="login-modal" aria-label="Inicio de sesión">
        <!-- Boton que cierra el modal de login. -->
        <button
          type="button"
          class="modal-close"
          aria-label="Cerrar login"
          @click="cerrarLogin"
        >
          ×
        </button>

        <Login />
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
