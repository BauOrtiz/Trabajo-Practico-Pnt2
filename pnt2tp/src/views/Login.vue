<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/storeAuth'

// --- ⚙️ 1. CONEXIÓN CON ENRUTADOR, STORES Y EVENTOS ---
const authStore = useAuthStore() // Store global para gestionar el estado de autenticación de la sesión
const router = useRouter()       // Enrutador de Vue para navegar entre pantallas programáticamente
const emit = defineEmits(['registrarse']) // Define eventos personalizados que este componente puede disparar hacia su padre

// --- 📍 2. ESTADOS REACTIVOS LOCALES ---
const email = ref('')       // Almacena el correo electrónico ingresado en el input
const contrasenia = ref('') // Almacena la contraseña ingresada en el input

// --- 👤 3. FUNCIONES DE NEGOCIO ---

/**
 * Gestiona el envío del formulario para iniciar sesión
 */
async function loguearse() {
  // Validación de seguridad local básica para no mandar campos vacíos al store
  if (!email.value || !contrasenia.value) {
    return
  }

  // Llama a la acción login del store de Pinia y espera el resultado del servidor
  const exitoso = await authStore.login(email.value, contrasenia.value)

  // Si las credenciales fueron correctas, redirige de inmediato a la pantalla de bienvenida
  if (exitoso) {
    router.push('/home')
  }
}

/**
 * Emite el evento 'registrarse' para avisar al componente padre y redirige al usuario al formulario de registro
 */
function registrarse() {
  emit('registrarse')
  router.push('/registro')
}

// --- 🚀 4. CICLO DE VIDA (PROTECCIÓN DE RUTA) ---
onMounted(async () => {
  // 🛡️ Filtro de seguridad: si el usuario ya inició sesión previamente y guardó su cookie/token,
  // lo redirige directamente al home para evitar que vuelva a ver la pantalla de login innecesariamente.
  if (authStore.isLoggedIn) {
    await router.push('/home')
  }
})
</script>

<template>
  <h1>Log In</h1>

  <!-- El modificador '.prevent' evita que el navegador recargue la página completa al enviar el formulario -->
  <form @submit.prevent="loguearse">
    
    <!-- Input para ingresar el Email del usuario -->
    <div class="form-group">
      <label>Email</label>
      <input v-model="email" type="email" required placeholder="tu@email.com" />
    </div>

    <!-- Input oculto (tipo password) para ingresar la Contraseña -->
    <div class="form-group">
      <label>Contraseña</label>
      <input v-model="contrasenia" type="password" required placeholder="******" />
    </div>

    <!-- ⚠️ Alerta de error: se muestra dinámicamente si el store de Pinia reporta credenciales inválidas o fallas de red -->
    <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

    <!-- 
      Botón de acción con estado dinámico:
      Si el store está cargando (loading === true), el botón se bloquea de forma interactiva 
      y muestra un feedback visual de espera para evitar clics repetitivos (spam).
    -->
    <button type="submit" :disabled="authStore.loading">
      {{ authStore.loading ? 'Ingresando...' : 'Iniciar Sesión' }}
    </button>

    <!-- Enlace de redirección interactiva hacia el registro de usuario -->
    <a @click.prevent="registrarse">Registrarse</a>
  </form>
</template>

<style scoped>
</style>