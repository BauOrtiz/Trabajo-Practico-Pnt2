<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'

const router = useRouter()
const estaticoStore = useEstaticoStore()

function detalleEstadio(id) {
  router.push(`/estadios/${id}`)
}

const cargando = computed(() => estaticoStore.loading && estaticoStore.estadios.length === 0)
const error = computed(() => estaticoStore.errores.estadios || '')

onMounted(() => {
  estaticoStore.cargarDatosMundial()
})
</script>

<template>
  <main class="estadios-page">
    <h1 class="titulo-estadios">Estadios</h1>

    <section v-if="cargando" class="mensaje">
      Cargando estadios...
    </section>

    <section v-else-if="error" class="mensaje mensaje--error">
      {{ error }}
    </section>

    <section v-else class="estadios-container">
      <article
        v-for="estadio in estaticoStore.estadios"
        :key="estadio.id"
        class="estadio-card"
        @click="detalleEstadio(estadio.id)"
      >
        <div class="card-image-container">
          <img :src="estadio.imagen" :alt="estadio.nombre" loading="lazy" />
          <span class="badge-pais">{{ estadio.pais }}</span>
        </div>

        <div class="card-content-container">
          <h3>{{ estadio.nombre }}</h3>

          <p class="info-location">
            <strong>Ciudad:</strong> {{ estadio.ciudad }}
          </p>

          <p class="info-capacity">
            <strong>Capacidad:</strong> {{ estadio.capacidad }} espectadores
          </p>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.estadios-page {
  padding-bottom: 32px;
}

.titulo-estadios {
  text-align: center;
  margin: 24px 0;
  font-size: 32px;
  color: #e5e7eb;
}

.mensaje {
  width: 90%;
  max-width: 850px;
  margin: 0 auto;
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background-color: #1f2937;
  color: #e5e7eb;
}

.mensaje--error {
  background-color: #7f1d1d;
  color: white;
}

.estadios-container {
  width: 90%;
  max-width: 850px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.estadio-card {
  background: #0d131f;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: row;
  height: 130px;
  cursor: pointer;
}

.estadio-card:hover {
  transform: translateY(-3px);
}

.card-image-container {
  position: relative;
  width: 230px;
  height: 130px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.badge-pais {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.card-content-container {
  flex: 1;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}

.card-content-container h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #cbd5e1;
}

.card-content-container p {
  margin: 4px 0;
  color: #d1d5db;
  font-size: 14px;
}

@media (max-width: 700px) {
  .estadios-container,
  .mensaje {
    width: 95%;
  }

  .estadio-card {
    height: 120px;
  }

  .card-image-container {
    width: 180px;
    height: 120px;
  }

  .card-content-container {
    padding: 10px 12px;
  }

  .card-content-container h3 {
    font-size: 16px;
  }

  .card-content-container p {
    font-size: 13px;
  }
}
</style>
