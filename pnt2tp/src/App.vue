<script setup>
import { ref, watch } from 'vue'
import Login from './views/Login.vue'
import { useAuthStore } from './stores/storeAuth'

const authStore = useAuthStore()
const mostrarLogin = ref(false)

function abrirLogin() {
  mostrarLogin.value = true
}

function cerrarLogin() {
  mostrarLogin.value = false
}

watch(
  () => authStore.isLoggedIn,
  (estaLogueado) => {
    if (estaLogueado) {
      cerrarLogin()
    }
  }
)
</script>

<template>
  <div class="app-layout">
    <header class="header">
      <nav class="navbar">
        <router-link to="/home">Inicio</router-link>
        <router-link to="/partidos">Partidos</router-link>
        <router-link to="/ranking">Ranking</router-link>
        <router-link to="/prode">Prode</router-link>
        <router-link to="/Paises">Selecciones</router-link>
        <router-link to="/Estadios">Estadios</router-link>
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

    <main class="main-content">
      <router-view />
    </main>

    <div v-if="mostrarLogin" class="modal-backdrop" @click.self="cerrarLogin">
      <section class="login-modal" aria-label="Inicio de sesión">
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
  padding: 18px 20px 8px;
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