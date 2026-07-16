<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/storeAuth'

// --- ⚙️ 1. CONEXIÓN CON ENRUTADOR Y STORES ---
const authStore = useAuthStore() // Store global para leer la sesión del usuario y despachar actualizaciones
const router = useRouter()       // Enrutador para redirigir si no hay sesión iniciada

// --- 📍 2. ESTADOS REACTIVOS LOCALES (DATOS PERSONALES) ---
const nombre = ref('')
const apellido = ref('')
const edad = ref('')
const email = ref('')

// --- 🔒 3. ESTADOS REACTIVOS LOCALES (CAMBIO DE CONTRASEÑA) ---
const passwordActual = ref('')
const passwordNueva = ref('')
const repetirPasswordNueva = ref('')

// --- 💬 4. MENSAJERÍA DE FEEDBACK ---
const mensajeExito = ref('')
const mensajeError = ref('')

// --- 📊 5. PROPIEDADES COMPUTADAS (REACTIVAS) ---

// usuarioLogueado: Atajo reactivo para vigilar la información del usuario autenticado en Pinia
const usuarioLogueado = computed(() => authStore.user)

// puedeGuardarPerfil: Regla de validación local. El botón se habilitará únicamente si estos campos no están vacíos
const puedeGuardarPerfil = computed(() => {
  return nombre.value.trim() !== '' && email.value.trim() !== ''
})

// --- 🛠️ 6. FUNCIONES DE APOYO Y FLUJO ---

/**
 * Carga o precarga los datos personales del usuario desde el store de Pinia hacia los inputs del formulario
 */
function cargarDatosPerfil() {
  if (authStore.user) {
    nombre.value = authStore.user.nombre || ''
    apellido.value = authStore.user.apellido || ''
    edad.value = authStore.user.edad || ''
    email.value = authStore.user.email || ''
  }
}

/**
 * Limpia cualquier mensaje de éxito o de error en la pantalla antes de procesar una nueva petición
 */
function limpiarMensajes() {
  mensajeExito.value = ''
  mensajeError.value = ''
}

// --- 🚀 7. CICLO DE VIDA Y OBSERVADORES ---

onMounted(async () => {
  // 🛡️ Filtro de seguridad: Si no está logueado, lo saca de la pantalla y lo manda al Home con un flag para abrir el Login
  if (!authStore.isLoggedIn) {
    await router.push('/home?login=1')
    return
  }

  // Si hay sesión iniciada, cargamos los datos del perfil
  await cargarDatosPerfil()
})

// watch(authStore.user?.id): Si el ID del usuario cambia (ej: cierra sesión e ingresa otro),
// actualizamos inmediatamente los inputs con la información de la nueva cuenta.
watch(
  () => authStore.user?.id,
  cargarDatosPerfil
)

// --- 💾 8. PETICIONES AL STORE (ACCIONES) ---

/**
 * Despacha la actualización de la información personal del usuario
 */
async function guardarPerfil() {
  limpiarMensajes()

  // Validación de seguridad secundaria por si se intenta forzar la petición
  if (!puedeGuardarPerfil.value) {
    mensajeError.value = 'El nombre y el email son obligatorios.'
    return
  }

  const datosActualizados = {
    nombre: nombre.value,
    apellido: apellido.value,
    edad: edad.value,
    email: email.value
  }

  // Envía los datos actualizados a la API a través del store de Pinia
  const perfilActualizado = await authStore.actualizarPerfil(datosActualizados)

  if (perfilActualizado) {
    mensajeExito.value = 'Perfil actualizado correctamente.'
  } else {
    mensajeError.value = authStore.error // Muestra el mensaje de error que devolvió la API
  }
}

/**
 * Ejecuta validaciones locales y despacha la solicitud de cambio de clave
 */
async function guardarNuevaPassword() {
  limpiarMensajes()

  // Validación 1: Todos los campos del formulario de contraseña son requeridos
  if (!passwordActual.value || !passwordNueva.value || !repetirPasswordNueva.value) {
    mensajeError.value = 'Completá todos los campos de contraseña.'
    return
  }

  // Validación 2: Largo mínimo de la nueva contraseña
  if (passwordNueva.value.length < 6) {
    mensajeError.value = 'La nueva contraseña debe tener al menos 6 caracteres.'
    return
  }

  // Validación 3: Coincidencia entre la nueva contraseña y su repetición
  if (passwordNueva.value !== repetirPasswordNueva.value) {
    mensajeError.value = 'Las nuevas contraseñas no coinciden.'
    return
  }

  // Envía la contraseña vieja y nueva al store de autenticación para cambiarla en el servidor
  const passwordCambiada = await authStore.cambiarPassword(
    passwordActual.value,
    passwordNueva.value
  )

  if (passwordCambiada) {
    mensajeExito.value = 'Contraseña actualizada correctamente.'

    // Reseteamos los campos de contraseña por seguridad para que queden limpios
    passwordActual.value = ''
    passwordNueva.value = ''
    repetirPasswordNueva.value = ''
  } else {
    mensajeError.value = authStore.error // Expone el error retornado por la base de datos (ej: clave actual incorrecta)
  }
}
</script>

<template>
  <main class="perfil-page">
    
    <!-- ✅ CASO A: Hay un usuario autenticado y mostramos sus paneles de configuración -->
    <section v-if="usuarioLogueado" class="perfil-card">
      <h1>Mi perfil</h1>

      <p class="descripcion">
        Desde esta sección podés consultar y modificar tus datos personales.
      </p>

      <!-- Carteles dinámicos para feedback en tiempo real -->
      <p v-if="mensajeExito" class="mensaje mensaje--exito">
        {{ mensajeExito }}
      </p>

      <p v-if="mensajeError" class="mensaje mensaje--error">
        {{ mensajeError }}
      </p>

      <!-- 📝 FORMULARIO 1: Datos Personales -->
      <section class="bloque-formulario">
        <h2>Datos personales</h2>

        <div class="form-grid">
          <label>
            Nombre
            <input
              v-model="nombre"
              type="text"
              placeholder="Ingresá tu nombre"
            >
          </label>

          <label>
            Apellido
            <input
              v-model="apellido"
              type="text"
              placeholder="Ingresá tu apellido"
            >
          </label>

          <label>
            Edad
            <input
              v-model="edad"
              type="number"
              min="1"
              placeholder="Ingresá tu edad"
            >
          </label>

          <label>
            Email
            <input
              v-model="email"
              type="email"
              placeholder="Ingresá tu email"
            >
          </label>
        </div>

        <!-- El botón se deshabilita si el store está procesando (loading) o si faltan datos requeridos -->
        <button
          class="btn-principal"
          :disabled="authStore.loading || !puedeGuardarPerfil"
          @click="guardarPerfil"
        >
          Guardar perfil
        </button>
      </section>

      <!-- 🔑 FORMULARIO 2: Seguridad y cambio de Contraseña -->
      <section class="bloque-formulario">
        <h2>Cambiar contraseña</h2>

        <div class="form-grid">
          <label>
            Contraseña actual
            <input
              v-model="passwordActual"
              type="password"
              placeholder="Ingresá tu contraseña actual"
            >
          </label>

          <label>
            Nueva contraseña
            <input
              v-model="passwordNueva"
              type="password"
              placeholder="Ingresá una nueva contraseña"
            >
          </label>

          <label>
            Repetir nueva contraseña
            <input
              v-model="repetirPasswordNueva"
              type="password"
              placeholder="Repetí la nueva contraseña"
            >
          </label>
        </div>

        <button
          class="btn-secundario"
          :disabled="authStore.loading"
          @click="guardarNuevaPassword"
        >
          Cambiar contraseña
        </button>
      </section>
    </section>

    <!-- 🚫 CASO B: No hay nadie logueado (pantalla de contingencia preventiva) -->
    <section v-else-if="!usuarioLogueado" class="perfil-card">
      <h1>No hay usuario logueado</h1>
      <p class="descripcion">
        Para ver tu perfil, primero tenés que iniciar sesión.
      </p>
    </section>

    <!-- 🔒 CASO C: Marcador de posición inactivo (seguridad muerta o futura) -->
    <section v-if="false" class="perfil-card">
      <h1>Perfil no disponible</h1>
      <p class="descripcion">
        Solo podés ver y editar tu propio perfil.
      </p>
    </section>
  </main>
</template>

<style scoped>
.perfil-page {
  min-height: 100vh;
  padding: 40px 20px;
  background-color: #f4f6f8;
  display: flex;
  justify-content: center;
}

.perfil-card {
  width: 100%;
  max-width: 850px;
  background-color: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

h1 {
  margin-bottom: 8px;
  color: #1f2937;
}

.descripcion {
  color: #6b7280;
  margin-bottom: 24px;
}

.bloque-formulario {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

h2 {
  margin-bottom: 20px;
  color: #374151;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

label {
  display: flex;
  flex-direction: column;
  font-weight: 600;
  color: #374151;
}

input {
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 15px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
}

button {
  margin-top: 24px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-principal {
  background-color: #2563eb;
  color: white;
}

.btn-secundario {
  background-color: #111827;
  color: white;
}

.mensaje {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-weight: 600;
}

.mensaje--exito {
  background-color: #dcfce7;
  color: #166534;
}

.mensaje--error {
  background-color: #fee2e2;
  color: #991b1b;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .perfil-card {
    padding: 24px;
  }
}
</style>
