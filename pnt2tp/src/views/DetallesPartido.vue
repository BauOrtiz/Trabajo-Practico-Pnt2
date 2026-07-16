<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { useAuthStore } from '../stores/storeAuth'
import { guardarPrediccion, obtenerPredicciones } from '../services/prediccionesService'

// --- 🧭 1. CONEXIÓN CON RUTAS Y STORES ---
const route = useRoute()                 // Para capturar parámetros de la URL (el ID del partido)
const estaticoStore = useEstaticoStore() // Store global para leer los partidos y el estado de la simulación
const authStore = useAuthStore()         // Store de autenticación para saber qué usuario está logueado

// --- ⚡ 2. LOGICA REACTIVA DE LA MÁQUINA DEL TIEMPO ---

// partidoId: Captura reactivamente el ID del partido desde la URL (/partido/:id)
const partidoId = computed(() => route.params.id)

// partido: ¡LA CLAVE DE LA REACTIVIDAD!
// Busca el partido seleccionado directamente desde el getter dinámico del Admin.
// Si el Admin cambia la fecha del sistema, este computed se vuelve a ejecutar al instante,
// recalculando el estado del partido ('programado', 'en curso' o 'finalizado') en pantalla.
const partido = computed(() => {
  return estaticoStore.partidosConEstadoCalculado.find(
    (p) => String(p.id) === String(partidoId.value)
  )
})

// --- 📍 3. ESTADOS LOCALES DEL COMPONENTE ---
const loading = ref(true)                  // Estado de carga visual
const error = ref('')                      // Mensaje de error general si el partido no existe
const pronosticoLocal = ref(null)          // Goles locales que ingresa el usuario en el input
const pronosticoVisitante = ref(null)      // Goles visitantes que ingresa el usuario en el input
const mensajePronostico = ref('')          // Alerta o feedback visual al guardar (éxito/error)
const mensajeTipo = ref('')                // Clase CSS del mensaje ('exito' o 'error')

// --- 💾 4. GESTIÓN DEL PRONÓSTICO DEL USUARIO ---

/**
 * Busca si el usuario actual ya guardó previamente una predicción para este partido.
 * Si existe, precarga los goles en los inputs del formulario.
 */
function cargarPronosticoDelUsuario() {
  // Limpiamos los inputs por defecto
  pronosticoLocal.value = null
  pronosticoVisitante.value = null

  if (!partido.value) return

  // Buscamos en el localStorage/servicio la predicción de este usuario para este partido
  const prediccionGuardada = obtenerPredicciones(authStore.user?.id).find(
    (item) => String(item.partidoId) === String(partido.value.id)
  )

  // Si existe una predicción previa, la inyectamos en los inputs
  if (prediccionGuardada) {
    pronosticoLocal.value = prediccionGuardada.golesLocal
    pronosticoVisitante.value = prediccionGuardada.golesVisitante
  }
}

/**
 * OBSERVADOR (Watcher):
 * Si el usuario inicia/cierra sesión, o si cambiamos de partido navegando por la app,
 * volvemos a buscar de inmediato si hay un pronóstico guardado para actualizar la vista.
 */
watch(
  () => [authStore.user?.id, partido.value?.id],
  () => {
    cargarPronosticoDelUsuario()
  }
)

// --- 📅 5. FORMATEADORES ---
/**
 * Convierte una fecha ISO (string) en un formato legible para Argentina (ej: "15 de junio, 18:00")
 */
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

// --- 🚀 6. INICIALIZACIÓN ---
onMounted(async () => {
  try {
    // Aseguramos que los datos del mundial estén cargados en Pinia
    await estaticoStore.cargarDatosMundial()

    if (estaticoStore.errores?.partidos) {
      error.value = estaticoStore.errores.partidos
      return
    }

    // Si el partido existe, cargamos la predicción del usuario
    if (partido.value) {
      error.value = ''
      cargarPronosticoDelUsuario()
    } else {
      error.value = 'No se encontró el partido en la base de datos.'
    }
  } catch {
    error.value = 'Hubo un problema al cargar los datos.'
  } finally {
    loading.value = false // Apagamos el spinner de carga
  }
})

// --- 🎯 7. GUARDAR PREDICCIÓN (PRODE) ---
const guardarPronostico = () => {
  mensajePronostico.value = ''

  // Validación 1: Debe estar logueado para apostar
  if (!authStore.user?.id) {
    mensajePronostico.value = 'Debés iniciar sesión para guardar una predicción.'
    mensajeTipo.value = 'error'
    return
  }

  // Validación 2: Inputs completos
  if (pronosticoLocal.value === null || pronosticoVisitante.value === null) {
    mensajePronostico.value = 'Completá ambos resultados antes de guardar.'
    mensajeTipo.value = 'error'
    return
  }

  // Validación 3: No se permiten goles negativos
  if (pronosticoLocal.value < 0 || pronosticoVisitante.value < 0) {
    mensajePronostico.value = 'Los goles no pueden ser negativos.'
    mensajeTipo.value = 'error'
    return
  }

  // Validación 4: ¡Sincronizado con el Admin!
  // Si el partido cambió de estado simulado (ahora está "en curso" o "finalizado"), abortamos.
  if (partido.value.estado !== 'programado') {
    mensajePronostico.value = 'No se puede predecir un partido ya iniciado o finalizado.'
    mensajeTipo.value = 'error'
    return
  }

  // Si pasa las validaciones, guardamos la predicción en el localStorage del usuario
  guardarPrediccion(
    {
      partidoId: partido.value.id,
      golesLocal: pronosticoLocal.value,
      golesVisitante: pronosticoVisitante.value
    },
    authStore.user.id
  )

  // Feedback visual de éxito
  mensajePronostico.value = `Pronóstico guardado: ${partido.value.equipoLocal} ${pronosticoLocal.value} - ${pronosticoVisitante.value} ${partido.value.equipoVisitante}`
  mensajeTipo.value = 'exito'
}
</script>

<template>
  <div class="partido-detalle-container">
    <!-- ⏳ CASO 1: Cargando datos del partido -->
    <div v-if="loading" class="loading">
      Cargando datos del partido...
    </div>

    <!-- ✅ CASO 2: Partido encontrado -->
    <div v-else-if="partido" class="partido-card">
      
      <!-- Badge dinámico de Grupo o Fase de eliminación directa -->
      <div class="grupo-badge">
        {{ partido.grupoId ? `Grupo ${partido.grupoId}` : partido.fase?.replaceAll('_', ' ') }}
      </div>

      <!-- El Marcador principal del partido -->
      <div class="marcador">
        <div class="equipo">
          <h2>{{ partido.equipoLocal }}</h2>
          <!-- ⚽ Muestra los goles REALES de la API únicamente si el partido ya finalizó según la simulación -->
          <span v-if="partido.estado === 'finalizado'" class="goles">
            {{ partido.golesLocal }}
          </span>
        </div>

        <div class="vs">VS</div>

        <div class="equipo">
          <h2>{{ partido.equipoVisitante }}</h2>
          <!-- ⚽ Muestra los goles REALES de la API únicamente si el partido ya finalizó según la simulación -->
          <span v-if="partido.estado === 'finalizado'" class="goles">
            {{ partido.golesVisitante }}
          </span>
        </div>
      </div>

      <!-- Información técnica del partido -->
      <div class="info-adicional">
        <p><strong>Fecha:</strong> {{ unformatedDate(partido.fecha) }}</p>
        <p>
          <strong>Estado:</strong> 
          <!-- Badge dinámico con estilos CSS variables según el estado (.programado, .finalizado, .en_curso) -->
          <span class="estado-texto" :class="partido.estado">
            {{ partido.estado }}
          </span>
        </p>
      </div>

      <!-- 🎮 SECCIÓN PRODE: Habilitada únicamente si el partido está en estado "programado" -->
      <div class="prode-section" v-if="partido.estado === 'programado'">
        <h3>Cargar mi Pronóstico</h3>

        <!-- Mensajes de éxito o error al guardar -->
        <p v-if="mensajePronostico" :class="['mensaje', mensajeTipo]">
          {{ mensajePronostico }}
        </p>

        <!-- Mensaje y botón de redirección si el usuario no inició sesión -->
        <div v-if="!authStore.user?.id" class="login-requerido">
          <p>Iniciá sesión para cargar tu pronóstico.</p>
          <router-link to="/login" class="btn-login">Ir al login</router-link>
        </div>

        <!-- Formulario con inputs numéricos reactivos (v-model) -->
        <template v-else>
          <div class="prode-inputs">
            <input v-model.number="pronosticoLocal" type="number" min="0" placeholder="0" class="input-gol" />
            <span class="guion">-</span>
            <input v-model.number="pronosticoVisitante" type="number" min="0" placeholder="0" class="input-gol" />
          </div>
          <button @click="guardarPronostico" class="btn-guardar">
            Confirmar Pronóstico
          </button>
        </template>
      </div>
    </div>

    <!-- ⚠️ CASO 3: Ocurrió un error en la carga de datos -->
    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <!-- 🚫 CASO 4: El ID de la URL no coincide con ningún partido -->
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
}

/* Colores para cada estado en la info adicional */
.estado-texto.programado {
  color: #2563eb;
}
.estado-texto.finalizado {
  color: #b91c1c;
}
.estado-texto.en.curso {
  color: #d97706; /* Color ámbar/naranja para partidos vivos */
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