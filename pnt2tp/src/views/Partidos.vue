<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { obtenerBanderaUrl } from '../utils/banderas.js'

// --- 🧭 1. ENRUTADOR Y STORES ---
const router = useRouter()               // Enrutador de Vue para viajar a los detalles del partido
const estaticoStore = useEstaticoStore() // Conexión al store de Pinia con todos los datos temporales del torneo

// etapaSeleccionada: Filtro reactivo vinculado al select (por defecto muestra 'todos' los partidos)
const etapaSeleccionada = ref('todos')

// --- 🧭 2. NAVEGACIÓN ---
/**
 * Navega de forma programática a la pantalla de detalles de un partido específico
 * @param {string|number} id - El ID único del partido seleccionado
 */
function irAlDetalle(id) {
  router.push(`/partido/${id}`)
}

// --- 🚀 3. INICIALIZACIÓN ---
onMounted(async () => {
  // Asegura la carga asíncrona de los datos estáticos del Mundial de la API al montar el fixture
  await estaticoStore.cargarDatosMundial()
})

// --- ⚙️ 4. FUNCIONES DE TRADUCCIÓN Y FORMATEO ---

/**
 * Traduce las constantes de fases de eliminación a un texto prolijo y legible para el usuario
 */
function nombreFase(fase) {
  const nombres = {
    DIECISEISAVOS: 'Dieciseisavos',
    OCTAVOS: 'Octavos',
    CUARTOS: 'Cuartos de final',
    SEMIFINAL: 'Semifinal',
    TERCER_PUESTO: 'Tercer puesto',
    FINAL: 'Final'
  }
  return nombres[fase] || fase
}

/**
 * Crea una clave única (un "ID" de etapa) para identificar si un partido pertenece a un grupo o fase eliminatoria
 * (Ej: devuelve 'grupo:A' o 'fase:OCTAVOS')
 */
function claveEtapa(partido) {
  return partido.grupoId ? `grupo:${partido.grupoId}` : `fase:${partido.fase}`
}

/**
 * Retorna el nombre de la etapa formateado listo para pintar en la interfaz
 */
function nombreEtapa(partido) {
  return partido.grupoId ? `Grupo ${partido.grupoId}` : nombreFase(partido.fase)
}

// --- ⚡ 5. LOGICA REACTIVA DE LA MAQUINA DEL TIEMPO ---

// partidos: ¡Sincronizado con el Administrador!
// Escucha de forma reactiva el getter del store que calcula los estados de los partidos
// según la fecha virtual elegida por el admin.
const partidos = computed(() => estaticoStore.partidosConEstadoCalculado || [])

// etapas: Mapea la lista de partidos para armar las opciones dinámicas del dropdown (select) de filtros,
// garantizando que aparezcan tanto los grupos ("Grupo A", "Grupo B", etc.) como las fases correspondientes.
const etapas = computed(() => {
  if (partidos.value.length === 0) {
    return []
  }
  const opciones = new Map()
  partidos.value.forEach((partido) => {
    opciones.set(claveEtapa(partido), nombreEtapa(partido))
  })
  return [...opciones].map(([valor, nombre]) => ({ valor, nombre }))
})

// mostrandoFaseGrupos: Validador booleano para ocultar o mostrar el selector de filtros según corresponda
const mostrandoFaseGrupos = computed(() => {
  return partidos.value.some((partido) => Boolean(partido.grupoId))
})

// partidosFiltrados: Filtra la lista de partidos de acuerdo a la etapa que el usuario haya seleccionado en el select dropdown
const partidosFiltrados = computed(() => {
  if (etapaSeleccionada.value === 'todos') {
    return partidos.value
  }
  return partidos.value.filter(
    (partido) => claveEtapa(partido) === etapaSeleccionada.value,
  )
})

/**
 * Convierte la fecha del partido en un formato local amigable para Argentina (ej: "15/06/2026 18:00")
 */
function formatearFecha(fecha) {
  const fechaPartido = new Date(fecha)
  return fechaPartido.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/**
 * Decide si debe mostrarse el versus clásico ('vs') o el resultado final del partido en tiempo virtual.
 * Si el estado simulado NO es finalizado, muestra 'vs' para proteger la consistencia visual.
 */
function mostrarResultado(partido) {
  if (partido.estado !== 'finalizado') {
    return 'vs'
  }
  return `${partido.golesLocal} - ${partido.golesVisitante}`
}

/**
 * Devuelve el estado virtual calculado del partido (ej: 'programado', 'en_curso', 'finalizado')
 */
function mostrarEstado(partido) {
  return partido.estado || 'programado'
}
</script>

<template>
  <main class="partidos-page">
    <!-- 🏠 ENCABEZADO Y SELECTOR DE FILTRO DE ETAPAS -->
    <section class="encabezado">
      <div>
        <h1>Partidos</h1>
        <p>Fixture del Mundial 2026</p>
      </div>
      <select v-if="mostrandoFaseGrupos" v-model="etapaSeleccionada" class="filtro-grupo">
        <option value="todos">Todos los grupos</option>
        <option v-for="etapa in etapas" :key="etapa.valor" :value="etapa.valor">
          {{ etapa.nombre }}
        </option>
      </select>
    </section>

    <!-- ⏳ CASO 1: Cargando datos del store de forma asíncrona -->
    <section v-if="estaticoStore.loading && partidos.length === 0" class="mensaje">
      Cargando partidos...
    </section>
    
    <!-- ⚠️ CASO 2: Error reportado por el store al solicitar los partidos de la API -->
    <section v-else-if="estaticoStore.error" class="mensaje error">
      {{ estaticoStore.error }}
    </section>
    
    <!-- ✅ CASO 3: Datos listos. Dibuja el listado completo de tarjetas de partidos -->
    <section v-else class="contenedor-partidos">
      <article 
        v-for="partido in partidosFiltrados" 
        :key="partido.id" 
        class="tarjeta-partido" 
        @click="irAlDetalle(partido.id)" 
        style="cursor: pointer;"
      >
        <!-- Fila superior de la tarjeta: Información de fase y el badge de estado dinámico -->
        <div class="datos-superiores">
          <span class="grupo">{{ nombreEtapa(partido) }}</span>
          <!-- 
            Pinta el estado calculado y le inyecta su estado como clase CSS 
            (ej: class="estado programado" o class="estado finalizado") para aplicar colores personalizados 
          -->
          <span class="estado" :class="partido.estado">{{ mostrarEstado(partido) }}</span>
        </div>
        
        <!-- Bloque central del partido con banderas, nombres y el marcador condicional -->
        <div class="enfrentamiento">
          <div class="equipo equipo-local">
            <img class="bandera-img" :src="obtenerBanderaUrl(partido.equipoLocal)" :alt="partido.equipoLocal" />
            <span>{{ partido.equipoLocal }}</span>
          </div>
          
          <strong class="resultado">
            {{ mostrarResultado(partido) }}
          </strong>
          
          <div class="equipo equipo-visitante">
            <span>{{ partido.equipoVisitante }}</span>
            <img class="bandera-img" :src="obtenerBanderaUrl(partido.equipoVisitante)" :alt="partido.equipoVisitante" />
          </div>
        </div>
        
        <!-- Fecha y hora formateada en el pie de la tarjeta -->
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
