<script setup>
import { computed, onMounted, ref } from 'vue'
import imagenInicio from '@/assets/img/prode-mundial-2026.png'
import { obtenerPartidos } from '../services/partidosService'

const partidos = ref([])

const proximosPartidos = computed(() => {
  const hoy = new Date()
  const enUnaSemana = new Date()
  enUnaSemana.setDate(hoy.getDate() + 7)

  return partidos.value.filter((p) => {
    const fecha = new Date(p.fecha)
    return fecha >= hoy && fecha <= enUnaSemana
  })
})

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

onMounted(async () => {
  partidos.value = await obtenerPartidos()
})
</script>

<template>
  <main class="home">
    <section class="hero">
      <img
        :src="imagenInicio"
        alt="Prode Mundial 2026"
        class="hero-img"
      />
    </section>

    <section class="proximos-partidos">
      <h2>Próximos partidos</h2>

      <div v-if="proximosPartidos.length === 0" class="sin-partidos">
        No hay partidos programados para esta semana.
      </div>

      <div v-else class="lista">
        <article v-for="partido in proximosPartidos" :key="partido.id" class="card">
          <span class="equipos">{{ partido.local }} vs {{ partido.visitante }}</span>
          <span class="fecha">{{ formatearFecha(partido.fecha) }}</span>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background-color: #050914;
}

.hero {
  width: 100%;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: auto;
  display: block;
}

.proximos-partidos {
  padding: 2rem 1.5rem;
}

.proximos-partidos h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 1rem;
}

.sin-partidos {
  color: #aaa;
  font-style: italic;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.2rem;
  background-color: #0d1b2e;
  border: 1px solid #1e3a5f;
  border-radius: 10px;
  color: #fff;
}

.equipos {
  font-weight: bold;
  font-size: 1rem;
}

.fecha {
  font-size: 0.9rem;
  color: #7eb8f7;
}
</style>