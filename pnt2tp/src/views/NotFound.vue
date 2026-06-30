<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function volverInicio() {
  router.push('/home')
}
</script>

<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <p class="codigo-error">404</p>

      <h1>Página no encontrada</h1>

      <p class="descripcion">
        La página que estás buscando no existe o fue movida.
      </p>

      <button type="button" @click="volverInicio">
        Volver al inicio
      </button>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  padding: 40px 20px;
  background-color: #f4f6f8;
  display: flex;
  justify-content: center;
  align-items: center;
}

.not-found-card {
  width: 100%;
  max-width: 520px;
  background-color: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.codigo-error {
  margin: 0;
  font-size: 80px;
  font-weight: 800;
  color: #2563eb;
}

h1 {
  margin-top: 8px;
  margin-bottom: 12px;
  color: #1f2937;
}

.descripcion {
  color: #6b7280;
  margin-bottom: 28px;
}

button {
  padding: 12px 22px;
  border: none;
  border-radius: 10px;
  background-color: #2563eb;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background-color: #1d4ed8;
}
</style>