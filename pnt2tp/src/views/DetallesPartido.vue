<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { useAuthStore } from '../stores/storeAuth'
import { guardarPrediccion, obtenerPredicciones } from '../services/prediccionesService'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

const route = useRoute()
const estaticoStore = useEstaticoStore()
const authStore = useAuthStore()

const partidoId = computed(() => route.params.id)

const partido = ref(null)
const loading = ref(true)
const error = ref('')

const pronosticoLocal = ref(null)
const pronosticoVisitante = ref(null)

const mensajePronostico = ref('')
const mensajeTipo = ref('')

function cargarPronosticoDelUsuario() {
  pronosticoLocal.value = null
  pronosticoVisitante.value = null

  if (!partido.value) return

  const prediccionGuardada = obtenerPredicciones(authStore.user?.id).find(
    (item) => String(item.partidoId) === String(partido.value.id)
  )

  if (prediccionGuardada) {
    pronosticoLocal.value = prediccionGuardada.golesLocal
    pronosticoVisitante.value = prediccionGuardada.golesVisitante
  }
}

watch(
  () => authStore.user?.id,
  cargarPronosticoDelUsuario
)

const unformatedDate = (fechaStr) => {
  if (!fechaStr) return ''
  const fecha = new Date(fechaStr)
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    await estaticoStore.cargarDatosMundial()

    if (estaticoStore.errores.partidos) {
      error.value = estaticoStore.errores.partidos
      return
    }

    partido.value = estaticoStore.obtenerPartidoPorId(partidoId.value)

    if (partido.value) {
      error.value = ''
      cargarPronosticoDelUsuario()
    } else {
      error.value = 'No se encontró el partido en la base de datos.'
    }
  } catch {
    error.value = 'Hubo un problema al cargar los datos.'
  } finally {
    loading.value = false
  }
})

const guardarPronostico = () => {
  mensajePronostico.value = ''

  if (!authStore.user?.id) {
    mensajePronostico.value = 'Debés iniciar sesión para guardar una predicción.'
    mensajeTipo.value = 'error'
    return
  }

  if (pronosticoLocal.value === null || pronosticoVisitante.value === null) {
    mensajePronostico.value = 'Completá ambos resultados antes de guardar.'
    mensajeTipo.value = 'error'
    return
  }

  if (pronosticoLocal.value < 0 || pronosticoVisitante.value < 0) {
    mensajePronostico.value = 'Los goles no pueden ser negativos.'
    mensajeTipo.value = 'error'
    return
  }

  if (obtenerEstadoPartido(partido.value) !== 'programado') {
    mensajePronostico.value = 'No se puede predecir un partido ya iniciado o finalizado.'
    mensajeTipo.value = 'error'
    return
  }

  guardarPrediccion(
    {
      partidoId: partido.value.id,
      golesLocal: pronosticoLocal.value,
      golesVisitante: pronosticoVisitante.value
    },
    authStore.user.id
  )

  mensajePronostico.value = `Pronóstico guardado: ${partido.value.equipoLocal} ${pronosticoLocal.value} - ${pronosticoVisitante.value} ${partido.value.equipoVisitante}`
  mensajeTipo.value = 'exito'
}
</script>

<template>
  <div class="partido-detalle-container">
    <div v-if="loading" class="loading">
      Cargando datos del partido...
    </div>

    <div v-else-if="partido" class="partido-card">
      <div class="grupo-badge">Grupo {{ partido.grupoId }}</div>

      <div class="marcador">
        <div class="equipo">
          <h2>{{ partido.equipoLocal }}</h2>
          <span v-if="obtenerEstadoPartido(partido) === 'finalizado'" class="goles">{{ partido.golesLocal }}</span>
        </div>

        <div class="vs">VS</div>

        <div class="equipo">
          <h2>{{ partido.equipoVisitante }}</h2>
          <span v-if="obtenerEstadoPartido(partido) === 'finalizado'" class="goles">{{ partido.golesVisitante }}</span>
        </div>
      </div>

      <div class="info-adicional">
        <p><strong>Estado:</strong> <span class="estado-texto">{{ obtenerEstadoPartido(partido) }}</span></p>
      </div>

      <div class="prode-section" v-if="obtenerEstadoPartido(partido) === 'programado'">
        <h3>Cargar mi Pronóstico</h3>

        <p v-if="mensajePronostico" :class="['mensaje', mensajeTipo]">
          {{ mensajePronostico }}
        </p>

        <div v-if="!authStore.user?.id" class="login-requerido">
          <p>Iniciá sesión para cargar tu pronóstico.</p>
          <router-link to="/login" class="btn-login">Ir al login</router-link>
        </div>

        <template v-else>
          <div class="prode-inputs">
            <input
              v-model.number="pronosticoLocal"
              type="number"
              min="0"
              placeholder="0"
              class="input-gol"
            />
            <span class="guion">-</span>
            <input
              v-model.number="pronosticoVisitante"
              type="number"
              min="0"
              placeholder="0"
              class="input-gol"
            />
          </div>
          <button @click="guardarPronostico" class="btn-guardar">
            Confirmar Pronóstico
          </button>
        </template>
      </div>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="error">
      No se encontró el partido especificado.
    </div>
  </div>
</template>

<style scoped>
.partido-detalle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  min-height: 80vh;
}

.loading, .error {
  color: white;
  font-size: 18px;
  text-align: center;
}

.partido-card {
  background-color: white;
  color: #111827;
  border-radius: 16px;
  padding: 30px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.grupo-badge {
  display: inline-block;
  background-color: #2563eb;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 20px;
}

.marcador {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 25px;
}

.equipo {
  flex: 1;
}

.equipo h2 {
  font-size: 20px;
  margin: 10px 0;
}

.goles {
  font-size: 36px;
  font-weight: 800;
  color: #374151;
}

.vs {
  font-weight: bold;
  color: #9ca3af;
  font-size: 18px;
  padding: 0 15px;
}

.info-adicional {
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 15px 0;
  margin-bottom: 25px;
  color: #4b5563;
  font-size: 15px;
}

.estado-texto {
  text-transform: capitalize;
  font-weight: 600;
  color: #059669;
}

.prode-section {
  background-color: #f3f4f6;
  padding: 20px;
  border-radius: 12px;
}

.prode-section h3 {
  margin-top: 0;
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 15px;
}

.mensaje {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-weight: 500;
  font-size: 14px;
}

.mensaje.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.mensaje.exito {
  background-color: #d1fae5;
  color: #065f46;
}

.login-requerido {
  text-align: center;
  padding: 1rem 0;
  color: #4b5563;
}

.btn-login {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.6rem 1.5rem;
  background-color: #2563eb;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
}

.btn-login:hover {
  background-color: #1d4ed8;
}

.prode-inputs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.input-gol {
  width: 60px;
  height: 50px;
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

.input-gol:focus {
  border-color: #2563eb;
  outline: none;
}

.guion {
  font-size: 24px;
  font-weight: bold;
  color: #9ca3af;
}

.btn-guardar {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.btn-guardar:hover {
  background-color: #059669;
}
</style>