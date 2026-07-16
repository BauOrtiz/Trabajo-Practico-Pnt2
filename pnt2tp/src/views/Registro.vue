<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/storeAuth'

// --- ⚙️ 1. CONEXIÓN CON ENRUTADOR Y STORES ---
const authStore = useAuthStore() // Store global para gestionar el registro de nuevos usuarios
const router = useRouter()       // Enrutador de Vue para redirigir programáticamente

// --- 📍 2. ESTADOS REACTIVOS LOCALES ---
const email = ref('')       // Almacena el correo ingresado para la nueva cuenta
const contrasenia = ref('') // Almacena la contraseña del nuevo usuario
const nombre = ref('')      // Almacena el nombre del nuevo participante

// --- 👤 3. FUNCIONES DE NEGOCIO ---

/**
 * Gestiona el envío del formulario para crear un nuevo usuario
 */
async function registrarse() {
  // Validación de seguridad local básica: aseguramos que ningún campo viaje vacío
  if (!email.value || !contrasenia.value || !nombre.value) {
    return
  }

  // Llama a la acción register del store de Pinia para persistir el nuevo usuario
  const exitoso = await authStore.register(nombre.value, email.value, contrasenia.value)

  // Si la creación fue exitosa, el store inicia sesión automáticamente y redirigimos al Home
  if (exitoso) {
    router.push('/home')
  }
}

/**
 * Redirige al usuario de vuelta a la pantalla de Home con el query param de login activo.
 * Esto es muy útil si tenés un modal de login en el Home o querés disparar esa acción de forma controlada.
 */
function irAlLogin() {
  router.push({
    path: '/home',
    query: { login: '1' }
  })
}

// --- 🚀 4. CICLO DE VIDA (PROTECCIÓN DE RUTA) ---
onMounted(async () => {
  // 🛡️ Filtro de seguridad preventivo: si un usuario ya está logueado,
  // no tiene sentido que intente registrar una cuenta nueva, por lo que lo mandamos directo al Home.
  if (authStore.isLoggedIn) {
    await router.push('/home')
  }
})
</script>

<template>
  <main class="registro-page">
    <section class="registro-card">
      
      <!-- 📝 ENCABEZADO DE LA TARJETA -->
      <div class="encabezado">
        <p class="subtitulo">Mundial 2026</p>
        <h1>Crear cuenta</h1>
        <p>
          Registrate para guardar tus predicciones, consultar tus puntos y competir en el ranking.
        </p>
      </div>

      <!-- El modificador '.prevent' bloquea el comportamiento nativo del navegador de recargar la página -->
      <form class="registro-form" @submit.prevent="registrarse">
        
        <!-- Input para ingresar el Nombre completo -->
        <div class="form-group">
          <label for="nombre">Nombre</label>
          <input
            id="nombre"
            v-model="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            autocomplete="name"
          />
        </div>

        <!-- Input para ingresar el Correo Electrónico -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="tu@email.com"
            autocomplete="email"
          />
        </div>

        <!-- Input oculto para definir la Contraseña -->
        <div class="form-group">
          <label for="contrasenia">Contraseña</label>
          <input
            id="contrasenia"
            v-model="contrasenia"
            type="password"
            required
            placeholder="******"
            autocomplete="new-password"
          />
        </div>

        <!-- ⚠️ Alerta de error: se muestra dinámicamente si el store de Pinia reporta que el email ya existe o hay fallas de red -->
        <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

        <!-- 
          Botón de envío con estado dinámico de carga:
          Si el store está cargando (loading === true), el botón se deshabilita para evitar clics múltiples.
        -->
        <button type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Creando cuenta...' : 'Registrarse' }}
        </button>
      </form>

      <!-- Botón secundario para los usuarios que ya poseen una cuenta activa -->
      <button type="button" class="login-link" @click="irAlLogin">
        Ya tengo cuenta
      </button>
    </section>
  </main>
</template>

<style scoped>
.registro-page {
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  padding: 32px 20px;
  color: white;
}

.registro-card {
  width: min(100%, 460px);
  padding: 28px;
  border: 1px solid #374151;
  border-radius: 10px;
  background: #1f2937;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.32);
}

.encabezado {
  margin-bottom: 22px;
}

.subtitulo {
  margin: 0 0 6px;
  color: #93c5fd;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 2rem;
}

.encabezado p:last-child {
  margin: 10px 0 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.registro-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  color: #e5e7eb;
  font-weight: 700;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: white;
  background: #111827;
  font: inherit;
}

input:focus {
  outline: 2px solid #2563eb;
  border-color: #93c5fd;
}

button[type='submit'] {
  margin-top: 4px;
  padding: 12px 14px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: #2563eb;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

button[type='submit']:hover {
  background: #1d4ed8;
}

button[type='submit']:disabled {
  cursor: wait;
  opacity: 0.7;
}

.login-link {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  border: 0;
  color: #93c5fd;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.login-link:hover {
  color: white;
}

.error-msg {
  margin: 0;
  padding: 10px 12px;
  color: #fecaca;
  background: #7f1d1d;
  border-radius: 8px;
}
</style>
