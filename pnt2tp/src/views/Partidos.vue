<script setup>
import { computed, onMounted, ref } from 'vue'
import { obtenerPartidos } from '../services/partidosService'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

const partidos = ref([])
const cargando = ref(true)
const error = ref('')
const grupoSeleccionado = ref('todos')

import { obtenerBanderaUrl } from '../utils/banderas.js'

import { useRouter } from 'vue-router'
const router = useRouter()

// Navega al detalle del partido seleccionado
function irAlDetalle(id) {
  router.push(`/partido/${id}`)
}

// Carga los partidos al iniciar la vista
onMounted(async () => {
  try {
    partidos.value = await obtenerPartidos()
  } catch (e) {
    error.value = 'No se pudieron cargar los partidos.'
  } finally {
    cargando.value = false
  }
})

// Obtiene la lista de grupos disponibles para el filtro
const grupos = computed(() => {
  const gruposUnicos = partidos.value.map((partido) => partido.grupoId)
  return [...new Set(gruposUnicos)].sort()
})

// Devuelve los partidos segun el grupo seleccionado
const partidosFiltrados = computed(() => {
  if (grupoSeleccionado.value === 'todos') {
    return partidos.value
  }

  return partidos.value.filter(
    (partido) => partido.grupoId === grupoSeleccionado.value,
  )
})

// Formatea la fecha del partido en formato local
function formatearFecha(fecha) {
  const fechaPartido = new Date(fecha)

  return fechaPartido.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

// Muestra el resultado si el partido finalizo, o "vs" si todavia no
function mostrarResultado(partido) {
  if (obtenerEstadoPartido(partido) !== 'finalizado') {
    return 'vs'
  }

  return `${partido.golesLocal} - ${partido.golesVisitante}`
}

// Obtiene el estado actual del partido
function mostrarEstado(partido) {
  return obtenerEstadoPartido(partido)
}
</script>

<template>
  <main class="partidos-page">
    <section class="encabezado">
      <div>
        <h1>Partidos</h1>
        <p>Fixture del Mundial 2026</p>
      </div>

      <select v-model="grupoSeleccionado" class="filtro-grupo">
        <option value="todos">Todos los grupos</option>
        <option v-for="grupo in grupos" :key="grupo" :value="grupo">
          Grupo {{ grupo }}
        </option>
      </select>
    </section>

    <section v-if="cargando" class="mensaje">
      Cargando partidos...
    </section>

    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>

    <section v-else class="contenedor-partidos">
      
      <article
        v-for="partido in partidosFiltrados"
        :key="partido.id"
        class="tarjeta-partido"
        @click="irAlDetalle(partido.id)" 
        style="cursor: pointer;"
      >
        <div class="datos-superiores">
          <span class="grupo">Grupo {{ partido.grupoId }}</span>
          <span class="estado">{{ mostrarEstado(partido) }}</span>
        </div>

        <div class="enfrentamiento">
          <div class="equipo equipo-local">
            <img
              class="bandera-img"
              :src="obtenerBanderaUrl(partido.equipoLocal)"
              :alt="partido.equipoLocal"
            />
            <span>{{ partido.equipoLocal }}</span>
          </div>

          <strong class="resultado">
            {{ mostrarResultado(partido) }}
          </strong>

          <div class="equipo equipo-visitante">
            <span>{{ partido.equipoVisitante }}</span>
            <img
              class="bandera-img"
              :src="obtenerBanderaUrl(partido.equipoVisitante)"
              :alt="partido.equipoVisitante"
            />
          </div>
        </div>

        <p class="fecha">
          {{ formatearFecha(partido.fecha) }}
        </p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.partidos-page {
  min-height: calc(100vh - 80px);
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px;
  color: white;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.encabezado h1 {
  margin: 0;
  font-size: 32px;
  color: white;
}

.encabezado p {
  margin: 6px 0 0;
  color: #9ca3af;
}

.filtro-grupo {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: white;
  font-size: 15px;
}

.mensaje {
  padding: 24px;
  text-align: center;
  border-radius: 12px;
  background-color: #1f2937;
  color: #e5e7eb;
}

.error {
  background-color: #7f1d1d;
  color: white;
}

.contenedor-partidos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.tarjeta-partido {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background-color: white;
  color: #111827;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.datos-superiores {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.grupo {
  font-weight: 600;
  color: #2563eb;
}

.estado {
  padding: 4px 10px;
  border-radius: 999px;
  background-color: #f3f4f6;
  color: #374151;
  font-size: 13px;
  text-transform: capitalize;
}

.enfrentamiento {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.equipo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #111827;
}

.equipo-local {
  justify-content: flex-start;
}

.equipo-visitante {
  justify-content: flex-end;
  text-align: right;
}

.bandera-img {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.resultado {
  min-width: 48px;
  text-align: center;
  color: #111827;
}

.fecha {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

@media (max-width: 640px) {
  .encabezado {
    flex-direction: column;
    align-items: flex-start;
  }

  .filtro-grupo {
    width: 100%;
  }

  .contenedor-partidos {
    grid-template-columns: 1fr;
  }

  .enfrentamiento {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .equipo-local,
  .equipo-visitante {
    justify-content: center;
    text-align: center;
  }
}
</style>
