<script setup>
import { computed, onMounted, ref } from 'vue'
import { obtenerPartidos } from '../services/partidosService'
import { obtenerBanderaUrl } from '../utils/banderas.js'
import { obtenerEstadoPartido } from '../utils/estadoPartido.js'
//bau
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
      String(prediccion.partidoId),
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
    const prediccion = prediccionesPorPartido.value.get(String(partido.id))
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

</template>

<style scoped>

</style>
