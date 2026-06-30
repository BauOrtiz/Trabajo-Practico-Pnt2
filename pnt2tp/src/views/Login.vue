<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/storeAuth'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const contrasenia = ref('')

async function loguearse() {
  if (!email.value || !contrasenia.value) {
    return
  }

  const exitoso = await authStore.login(email.value, contrasenia.value)

  if (exitoso) {
    router.push('/home')
  }
}

function registrarse() {
  router.push('/registro')
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    router.push('/home')
  }
})
</script>

<template>
  <h1>Log In</h1>

  <form @submit.prevent="loguearse">
    <div class="form-group">
      <label>Email</label>
      <input v-model="email" type="email" required placeholder="tu@email.com" />
    </div>

    <div class="form-group">
      <label>Contraseña</label>
      <input v-model="contrasenia" type="password" required placeholder="******" />
    </div>

    <p v-if="authStore.error" class="error-msg">{{ authStore.error }}</p>

    <button type="submit" :disabled="authStore.loading">
      {{ authStore.loading ? 'Ingresando...' : 'Iniciar Sesión' }}
    </button>

    <a @click.prevent="registrarse">Registrarse</a>
  </form>
</template>

<style scoped>
</style>
