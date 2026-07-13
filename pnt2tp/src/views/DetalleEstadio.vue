<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'

const route = useRoute()
const router = useRouter()

const estaticoStore = useEstaticoStore()
const estadioId = computed(() => route.params.id)

onMounted(async () => {
  await estaticoStore.cargarDatosMundial()
})

const cargando = computed(() => estaticoStore.loading && estaticoStore.estadios.length === 0)

const estadio = computed(() => {
  if (!estaticoStore.estadios || estaticoStore.estadios.length === 0) {
    return null
  }

  return estaticoStore.obtenerEstadioPorId(estadioId.value)
})


const error = computed(() => {
  if (estaticoStore.errores.estadios) {
    return estaticoStore.errores.estadios
  }

  if (estaticoStore.cargado && !estadio.value) {
    return 'No se encontró el estadio en la base de datos.'
  }

  return ''
})

function volverAEstadios() {
  router.push('/estadios')
}
</script>

<template>
  <section class="detalle-page">
    <div v-if="error" class="mensaje-error">
      <h1>{{ error }}</h1>
      <button @click="volverAEstadios">Volver a estadios</button>
    </div>

    <div v-else-if="cargando || !estadio" class="mensaje-cargando">
      <h1>Cargando estadio...</h1>
    </div>

    <article v-else class="detalle-card">
      <div class="imagen-container">
        <img :src="estadio.imagen" :alt="estadio.nombre" />
        <span class="badge-pais">{{ estadio.pais }}</span>
      </div>

      <div class="detalle-info">
        <h1>{{ estadio.nombre }}</h1>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">País</span>
            <strong>{{ estadio.pais }}</strong>
          </div>

          <div class="info-item">
            <span class="label">Ciudad</span>
            <strong>{{ estadio.ciudad }}</strong>
          </div>

          <div class="info-item">
            <span class="label">Capacidad</span>
            <strong>{{ estadio.capacidad }} espectadores</strong>
          </div>

          <div v-if="estadio.id" class="info-item">
            <span class="label">Código</span>
            <strong>{{ estadio.id }}</strong>
          </div>
        </div>

        <p class="descripcion">
          Este estadio será una de las sedes del Mundial 2026. Está ubicado en
          {{ estadio.ciudad }}, {{ estadio.pais }}, y cuenta con una capacidad aproximada
          de {{ estadio.capacidad }} espectadores.
        </p>

        <button class="btn-volver" @click="volverAEstadios">
          Volver a estadios
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.detalle-page {
  width: 90%;
  max-width: 850px;
  margin: 32px auto;
}

.mensaje-cargando,
.mensaje-error {
  text-align: center;
  margin-top: 40px;
  color: #e5e7eb;
}

.detalle-card {
  background: #0d131f;
  border-radius: 16px;
  padding-top: 24px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
}

.imagen-container {
  position: relative;
  width: 90%;
  max-width: 620px;
  height: 210px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 14px;
}

.imagen-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.badge-pais {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 6px 12px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: bold;
}

.detalle-info {
  padding: 28px;
}

.detalle-info h1 {
  margin: 0 0 24px 0;
  color: #e5e7eb;
  font-size: 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.info-item {
  background: #111827;
  border-radius: 12px;
  padding: 16px;
}

.label {
  display: block;
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 6px;
}

.info-item strong {
  color: #e5e7eb;
  font-size: 16px;
}

.descripcion {
  color: #d1d5db;
  line-height: 1.6;
  margin-bottom: 24px;
}

.btn-volver,
.mensaje-error button {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: bold;
}

.btn-volver:hover,
.mensaje-error button:hover {
  background: #1d4ed8;
}

@media (max-width: 700px) {
  .imagen-container {
    width: 92%;
    height: 180px;
  }

  .detalle-info {
    padding: 20px;
  }

  .detalle-info h1 {
    font-size: 26px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
