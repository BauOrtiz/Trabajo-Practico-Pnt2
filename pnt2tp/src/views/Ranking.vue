<script setup>
import { computed, onMounted, ref } from 'vue'
import { obtenerPartidos } from '../services/partidosService'
import { obtenerBanderaUrl } from '../utils/banderas.js'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

const partidos = ref([])
const predicciones = ref([])
const grupoSeleccionado = ref('A')
const cargando = ref(true)
const error = ref('')

// Esta funcion agrega un id a cada partido si la API no lo trae.
function normalizarPartidos(partidosData) {
  return partidosData.map((partido, index) => ({
    ...partido,
    id: partido.id || index + 1
  }))
}

// Esta funcion carga las predicciones guardadas en localStorage.
function cargarPredicciones() {
  const prediccionesGuardadas = localStorage.getItem('predicciones')
  predicciones.value = prediccionesGuardadas ? JSON.parse(prediccionesGuardadas) : []
}

// Esta funcion calcula los grupos disponibles.
const grupos = computed(() => {
  const gruposUnicos = partidos.value
    .map((partido) => partido.grupoId)
    .filter((grupo) => grupo && grupo !== 'KO')

  return [...new Set(gruposUnicos)].sort()
})

// Esta funcion filtra los partidos del grupo seleccionado.
const partidosDelGrupo = computed(() => {
  return partidos.value.filter((partido) => partido.grupoId === grupoSeleccionado.value)
})

// Esta funcion ordena las predicciones por id de partido.
const prediccionesPorPartido = computed(() => {
  return new Map(
    predicciones.value.map((prediccion) => [
      Number(prediccion.partidoId),
      prediccion
    ])
  )
})

// Esta funcion crea una fila inicial para un equipo.
function crearFila(equipo) {
  return {
    equipo,
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    golesFavor: 0,
    golesContra: 0,
    diferencia: 0,
    puntos: 0
  }
}

// Esta funcion suma un resultado a la tabla de posiciones.
function sumarPartido(tabla, equipoLocal, equipoVisitante, golesLocal, golesVisitante) {
  if (!tabla.has(equipoLocal)) tabla.set(equipoLocal, crearFila(equipoLocal))
  if (!tabla.has(equipoVisitante)) tabla.set(equipoVisitante, crearFila(equipoVisitante))

  const local = tabla.get(equipoLocal)
  const visitante = tabla.get(equipoVisitante)

  local.jugados += 1
  visitante.jugados += 1
  local.golesFavor += golesLocal
  local.golesContra += golesVisitante
  visitante.golesFavor += golesVisitante
  visitante.golesContra += golesLocal

  if (golesLocal > golesVisitante) {
    local.ganados += 1
    visitante.perdidos += 1
    local.puntos += 3
  } else if (golesLocal < golesVisitante) {
    visitante.ganados += 1
    local.perdidos += 1
    visitante.puntos += 3
  } else {
    local.empatados += 1
    visitante.empatados += 1
    local.puntos += 1
    visitante.puntos += 1
  }

  local.diferencia = local.golesFavor - local.golesContra
  visitante.diferencia = visitante.golesFavor - visitante.golesContra
}

// Esta funcion ordena la tabla por puntos y diferencia de gol.
function ordenarTabla(tabla) {
  return [...tabla.values()].sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos
    if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia
    if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor
    return a.equipo.localeCompare(b.equipo)
  })
}

// Esta funcion crea la tabla base con todos los equipos del grupo.
function crearTablaBase() {
  const tabla = new Map()

  for (const partido of partidosDelGrupo.value) {
    if (!tabla.has(partido.equipoLocal)) tabla.set(partido.equipoLocal, crearFila(partido.equipoLocal))
    if (!tabla.has(partido.equipoVisitante)) tabla.set(partido.equipoVisitante, crearFila(partido.equipoVisitante))
  }

  return tabla
}

// Esta funcion calcula el ranking con resultados reales.
const rankingReal = computed(() => {
  const tabla = crearTablaBase()

  for (const partido of partidosDelGrupo.value) {
    if (obtenerEstadoPartido(partido) !== 'finalizado') continue

    sumarPartido(
      tabla,
      partido.equipoLocal,
      partido.equipoVisitante,
      Number(partido.golesLocal),
      Number(partido.golesVisitante)
    )
  }

  return ordenarTabla(tabla)
})

// Esta funcion calcula el ranking con las predicciones del usuario.
const rankingApostado = computed(() => {
  const tabla = crearTablaBase()

  for (const partido of partidosDelGrupo.value) {
    const prediccion = prediccionesPorPartido.value.get(Number(partido.id))
    if (!prediccion) continue

    sumarPartido(
      tabla,
      partido.equipoLocal,
      partido.equipoVisitante,
      Number(prediccion.golesLocal),
      Number(prediccion.golesVisitante)
    )
  }

  return ordenarTabla(tabla)
})

// Esta funcion carga los datos al entrar a la pagina.
onMounted(async () => {
  try {
    cargarPredicciones()
    partidos.value = normalizarPartidos(await obtenerPartidos())
  } catch (e) {
    error.value = 'No se pudo cargar el ranking.'
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <main class="ranking-page">
    <section class="encabezado">
      <div>
        <h1>Ranking</h1>
        <p>Posiciones reales y posiciones segun tus predicciones.</p>
      </div>

      <label class="selector">
        Grupo
        <select v-model="grupoSeleccionado">
          <option v-for="grupo in grupos" :key="grupo" :value="grupo">
            Grupo {{ grupo }}
          </option>
        </select>
      </label>
    </section>

    <section v-if="cargando" class="mensaje">
      Cargando ranking...
    </section>

    <section v-else-if="error" class="mensaje error">
      {{ error }}
    </section>

    <section v-else class="tablas-ranking">
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
            <tr v-for="(fila, index) in rankingReal" :key="fila.equipo">
              <td>{{ index + 1 }}</td>
              <td class="equipo">
                <img :src="obtenerBanderaUrl(fila.equipo)" :alt="fila.equipo" />
                <span>{{ fila.equipo }}</span>
              </td>
              <td>{{ fila.jugados }}</td>
              <td>{{ fila.ganados }}</td>
              <td>{{ fila.empatados }}</td>
              <td>{{ fila.perdidos }}</td>
              <td>{{ fila.diferencia }}</td>
              <td class="puntos">{{ fila.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </article>

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
            <tr v-for="(fila, index) in rankingApostado" :key="fila.equipo">
              <td>{{ index + 1 }}</td>
              <td class="equipo">
                <img :src="obtenerBanderaUrl(fila.equipo)" :alt="fila.equipo" />
                <span>{{ fila.equipo }}</span>
              </td>
              <td>{{ fila.jugados }}</td>
              <td>{{ fila.ganados }}</td>
              <td>{{ fila.empatados }}</td>
              <td>{{ fila.perdidos }}</td>
              <td>{{ fila.diferencia }}</td>
              <td class="puntos">{{ fila.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </article>
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

.encabezado h1,
.tabla-header h2 {
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

th,
td {
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

  .selector,
  .selector select {
    width: 100%;
  }

  .tablas-ranking {
    grid-template-columns: 1fr;
  }

  .tabla-card {
    overflow-x: auto;
  }
}
</style>
