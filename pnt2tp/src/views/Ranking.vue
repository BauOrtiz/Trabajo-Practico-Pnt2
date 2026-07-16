<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/storeAuth'
import { obtenerPredicciones } from '../services/prediccionesService'
import { calcularTablaGrupo, obtenerGruposDisponibles } from '../services/grupoService'
import { calcularUsuariosConPuntos } from '../services/puntosService'
import { useEstaticoStore } from '../stores/storeEstaticos'
import { obtenerBanderaUrl } from '../utils/banderas.js'

// --- ⚙️ 1. CONEXIÓN CON STORES Y SERVICIOS ---
const authStore = useAuthStore()         // Store global para validar sesión y usuario actual
const estaticoStore = useEstaticoStore() // Store global para obtener partidos dinámicos del Admin

// --- 📍 2. ESTADOS REACTIVOS LOCALES ---
const predicciones = ref([])          // Predicciones personales cargadas por el usuario autenticado
const grupoSeleccionado = ref('A')    // Grupo actual de visualización (por defecto el grupo A)
const usuarios = ref([])              // Lista total de usuarios recuperada de MockAPI
const cargandoAmigos = ref(true)      // Flag visual para indicar que la tabla de amigos está en proceso de carga
const errorAmigos = ref('')           // Captura fallas de red al pegarle a MockAPI

// Ruta externa del backend simulado en MockAPI para persistir los usuarios del Prode
const API_USUARIOS = 'https://6a2b1b9ab687a7d5cbc4de36.mockapi.io/prode/Usuarios'

// --- ⚡ 3. PROPIEDADES COMPUTADAS Y FILTRADO TEMPORAL ---

// partidos: ¡Sincronizado con el Admin!
// Recupera la lista de partidos con sus estados virtuales según la fecha elegida.
const partidos = computed(() => estaticoStore.partidosConEstadoCalculado || [])

// 🛡️ FILTRO DE SEGURIDAD CLAVE:
// Creamos una lista reactiva que contiene ÚNICAMENTE los partidos en estado 'finalizado'.
// Esto evita que partidos programados o en curso se procesen, impidiendo empates 0-0 ficticios en las tablas.
const partidosFinalizados = computed(() => {
  return partidos.value.filter(partido => partido.estado === 'finalizado')
})

// cargando: Evalúa si los datos de Pinia están cargándose y aún no hay partidos locales en memoria
const cargando = computed(() => estaticoStore.loading && partidos.value.length === 0)

// error: Expone de forma limpia cualquier error que surja al traer partidos del store
const error = computed(() => estaticoStore.error || '')

// usuariosOrdenados: Recalcula y ordena dinámicamente la tabla de posiciones de tus amigos.
// Utiliza la lista segura 'partidosFinalizados' para evaluar los aciertos contra los resultados simulados.
const usuariosOrdenados = computed(() => {
  if (!partidosFinalizados.value || partidosFinalizados.value.length === 0) return []
  
  // Calcula los puntos cruzando pronósticos de cada usuario contra resultados finalizados virtuales
  const usuariosConPuntos = calcularUsuariosConPuntos(usuarios.value, partidosFinalizados.value)
  
  // Retorna una copia ordenada de mayor a menor según el puntaje total acumulado
  return [...usuariosConPuntos].sort((a, b) => (b.puntosTotales || 0) - (a.puntosTotales || 0))
})

// --- 🛡️ 4. FUNCIONES DE APOYO ---

/**
 * Validador helper para saber si el usuario de la fila es el que tiene la sesión activa (resalta su fila)
 */
function esUsuarioActual(usuario) {
  return authStore.user && authStore.user.id === usuario.id
}

/**
 * Genera el avatar en texto del usuario extrayendo las iniciales de su nombre y apellido
 */
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map((parte) => parte[0]).join('').toUpperCase().slice(0, 2)
}

/**
 * Devuelve un color hexadecimal simulando una medalla de Oro, Plata o Bronce para el top 3 de amigos
 */
function medallaColor(pos) {
  if (pos === 0) return '#f0b429' // Oro
  if (pos === 1) return '#aaaaaa' // Plata
  if (pos === 2) return '#cd7f32' // Bronce
  return '#555'                   // Resto de los puestos
}

/**
 * Trae de forma persistente tus predicciones guardadas en el LocalStorage
 */
function cargarPredicciones() {
  predicciones.value = obtenerPredicciones(authStore.user?.id)
}

// Watcher: Si el usuario actual cambia (inicia o cierra sesión), cargamos sus predicciones correspondientes
watch(
  () => authStore.user?.id,
  cargarPredicciones
)

// grupos: Analiza de forma inteligente todos los partidos del fixture para saber qué grupos existen
const grupos = computed(() => obtenerGruposDisponibles(partidos.value))

// rankingReal: Genera la tabla de posiciones real del grupo seleccionado,
// computando exclusivamente los partidos que el Admin ya marcó como 'finalizados'.
const rankingReal = computed(() => {
  if (partidosFinalizados.value.length === 0) return []
  return calcularTablaGrupo(partidosFinalizados.value, grupoSeleccionado.value)
})

// rankingApostado: Genera la tabla de posiciones calculando "qué pasaría" en la tabla del grupo
// de acuerdo a los pronósticos cargados por el usuario para los partidos finalizados simulados.
const rankingApostado = computed(() => {
  if (partidosFinalizados.value.length === 0) return []
  return calcularTablaGrupo(partidosFinalizados.value, grupoSeleccionado.value, predicciones.value)
})

// --- 🚀 5. INICIALIZACIÓN DE LA VISTA (onMounted) ---
onMounted(async () => {
  cargarPredicciones()                     // Precarga predicciones personales
  await estaticoStore.cargarDatosMundial() // Asegura que los datos globales de partidos estén listos
  
  try {
    // Pegamos a MockAPI para traer a todos los participantes registrados en el Prode
    const res = await fetch(API_USUARIOS)
    if (!res.ok) {
      throw new Error('No se pudo cargar la lista de usuarios.')
    }
    const data = await res.json()
    usuarios.value = Array.isArray(data) ? data : []
  } catch (errorUsuarios) {
    errorAmigos.value = 'No se pudo cargar el ranking de amigos.'
  } finally {
    cargandoAmigos.value = false // Apaga el loading del panel de amigos
  }
})
</script>

<template>
  <main class="ranking-page">
    <!-- ENCABEZADO Y SELECTOR DE GRUPOS -->
    <section class="encabezado", v-if="!estaticoStore.faseGruposFinalizada">
      <div>
        <h1>Ranking</h1>
        <p>Posiciones reales y posiciones segun tus predicciones.</p>
      </div>
      <label class="selector"> Grupo
        <select v-model="grupoSeleccionado">
          <option v-for="grupo in grupos" :key="grupo" :value="grupo">
            Grupo {{ grupo }}
          </option>
        </select>
      </label>
    </section>

    <!-- ESTADOS DE ESPERA Y RED -->
    <section v-if="cargando" class="mensaje">
      Cargando ranking...
    </section>
    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>
    
    <!-- CONTENEDOR DE TABLAS DE POSICIONES EN PARALELO (REAL VS PRODE) -->
    <section v-else class="tablas-ranking", v-if="!estaticoStore.faseGruposFinalizada"">
      
      <!-- TABLA 1: Ranking Real (Mundial en curso según Admin) -->
      <article class="tabla-card">
        <div class="tabla-header">
          <h2>Ranking real</h2>
          <span>Grupo {{ grupoSeleccionado }}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, index) in rankingReal" :key="fila.nombre">
              <td>{{ index + 1 }}</td>
              <td class="equipo">
                <img :src="obtenerBanderaUrl(fila.nombre)" :alt="fila.nombre" />
                <span>{{ fila.nombre }}</span>
              </td>
              <td>{{ fila.jugados }}</td>
              <td>{{ fila.ganados }}</td>
              <td>{{ fila.empatados }}</td>
              <td>{{ fila.perdidos }}</td>
              <td>{{ fila.diferenciaGol }}</td>
              <td class="puntos">{{ fila.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <!-- TABLA 2: Ranking Apostado (Cómo quedaría el grupo según tus predicciones) -->
      <article class="tabla-card">
        <div class="tabla-header">
          <h2>Mi ranking apostado</h2>
          <span>{{ predicciones.length }} predicciones</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, index) in rankingApostado" :key="fila.nombre">
              <td>{{ index + 1 }}</td>
              <td class="equipo">
                <img :src="obtenerBanderaUrl(fila.nombre)" :alt="fila.nombre" />
                <span>{{ fila.nombre }}</span>
              </td>
              <td>{{ fila.jugados }}</td>
              <td>{{ fila.ganados }}</td>
              <td>{{ fila.empatados }}</td>
              <td>{{ fila.perdidos }}</td>
              <td>{{ fila.diferenciaGol }}</td>
              <td class="puntos">{{ fila.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <!-- TABLA 3: Ranking de amigos (Competencia del Prode con tus compañeros) -->
    <section class="ranking-amigos">
      <section v-if="!estaticoStore.faseGruposFinalizada"><h2 class="amigos-titulo">Ranking de amigos Grupos</h2></section>
      <section v-if="estaticoStore.faseGruposFinalizada"><h2 class="amigos-titulo">Ranking de amigos Fase Eliminatorias</h2></section>

      
      <div v-if="cargandoAmigos" class="mensaje">Cargando amigos...</div>
      <div v-else-if="errorAmigos" class="mensaje error">
        {{ errorAmigos }}
      </div>
      <div v-else-if="usuariosOrdenados.length === 0" class="mensaje">
        No hay usuarios registrados todavia.
      </div>
      <template v-else>
        <!-- Recorre los usuarios calculando sus aciertos y ordenándolos de mayor a menor puntaje -->
        <div v-for="(usuario, idx) in usuariosOrdenados" :key="usuario.id" :class="['amigo-card', esUsuarioActual(usuario) ? 'amigo-card--propio' : '']" >
          <span class="amigo-pos" :style="{ color: medallaColor(idx) }">{{ idx + 1 }}</span>
          <div class="amigo-avatar">{{ iniciales(usuario.nombre) }}</div>
          <div class="amigo-info">
            <span class="amigo-nombre">
              {{ usuario.nombre }}
              <span v-if="esUsuarioActual(usuario)" class="vos-tag">vos</span>
            </span>
            <span class="amigo-pts">{{ usuario.puntosTotales || 0 }} puntos</span>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.ranking-page {
  min-height: calc(100vh - 80px);
  max-width: 1180px;
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
.encabezado h1, .tabla-header h2 {
  margin: 0;
}
.encabezado p {
  margin: 6px 0 0;
  color: #9ca3af;
}
.selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #d1d5db;
  font-weight: 600;
}
.selector select {
  min-width: 160px;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: white;
  color: #111827;
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
}
.tablas-ranking {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.tabla-card {
  overflow: hidden;
  border: 1px solid #243044;
  border-radius: 8px;
  background-color: #ffffff;
  color: #111827;
}
.tabla-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid #e5e7eb;
}
.tabla-header span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  font-size: 14px;
}
th {
  background-color: #f3f4f6;
  color: #374151;
  font-size: 12px;
  text-transform: uppercase;
}
tr:last-child td {
  border-bottom: 0;
}
.equipo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  text-align: left;
  font-weight: 700;
}
.equipo img {
  width: 28px;
  height: 20px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}
.puntos {
  font-weight: 800;
  color: #2563eb;
}
@media (max-width: 900px) {
  .encabezado {
    flex-direction: column;
    align-items: flex-start;
  }
  .selector, .selector select {
    width: 100%;
  }
  .tablas-ranking {
    grid-template-columns: 1fr;
  }
  .tabla-card {
    overflow-x: auto;
  }
}
.ranking-amigos {
  margin-top: 2.5rem;
}
.amigos-titulo {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 1rem;
}
.amigo-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background-color: #fff;
  border-radius: 50px;
  padding: 0.6rem 1.2rem;
  margin-bottom: 0.5rem;
  color: #111;
}
.amigo-card--propio {
  background-color: #fef3d0;
}
.amigo-pos {
  font-size: 1rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}
.amigo-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #1a2340;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: #f0b429;
  flex-shrink: 0;
}
.amigo-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.amigo-nombre {
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.amigo-pts {
  font-size: 0.78rem;
  color: #666;
}
.vos-tag {
  font-size: 0.7rem;
  background-color: #f0b429;
  color: #050914;
  border-radius: 50px;
  padding: 1px 8px;
  font-weight: bold;
}
</style>