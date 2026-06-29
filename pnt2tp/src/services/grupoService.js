import { obtenerEstadoPartido } from '../utils/estadoPartido.js'

function crearEquipo(nombre) {
  return {
    nombre,
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    golesFavor: 0,
    golesContra: 0,
    diferenciaGol: 0,
    puntos: 0
  }
}

function sumarResultado(tabla, partido, golesLocal, golesVisitante) {
  const local = tabla.get(partido.equipoLocal)
  const visitante = tabla.get(partido.equipoVisitante)

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

  local.diferenciaGol = local.golesFavor - local.golesContra
  visitante.diferenciaGol = visitante.golesFavor - visitante.golesContra
}

function ordenarTabla(tabla) {
  return [...tabla.values()].sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos
    if (b.diferenciaGol !== a.diferenciaGol) {
      return b.diferenciaGol - a.diferenciaGol
    }
    if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor
    return a.nombre.localeCompare(b.nombre)
  })
}

export function obtenerGruposDisponibles(partidos, incluirEliminatorias = false) {
  const grupos = partidos
    .map((partido) => partido.grupoId || 'Sin grupo')
    .filter((grupoId) => incluirEliminatorias || grupoId !== 'KO')

  return [...new Set(grupos)].sort((a, b) =>
    String(a).localeCompare(String(b))
  )
}

// Si se reciben predicciones, calcula una tabla proyectada.
// En caso contrario, utiliza solamente resultados reales finalizados.
export function calcularTablaGrupo(partidos, grupoId, predicciones = null) {
  const partidosDelGrupo = partidos.filter(
    (partido) => (partido.grupoId || 'Sin grupo') === grupoId
  )
  const tabla = new Map()

  for (const partido of partidosDelGrupo) {
    if (!tabla.has(partido.equipoLocal)) {
      tabla.set(partido.equipoLocal, crearEquipo(partido.equipoLocal))
    }
    if (!tabla.has(partido.equipoVisitante)) {
      tabla.set(partido.equipoVisitante, crearEquipo(partido.equipoVisitante))
    }
  }

  const prediccionesPorPartido = predicciones
    ? new Map(
        predicciones.map((prediccion) => [
          String(prediccion.partidoId),
          prediccion
        ])
      )
    : null

  // Primero filtramos los partidos que tienen un resultado para calcular.
  // Si hay predicciones usamos esas; si no, solo usamos partidos finalizados.
  const partidosConResultado = partidosDelGrupo.filter((partido) => {
    if (prediccionesPorPartido) {
      return prediccionesPorPartido.has(String(partido.id))
    }

    return obtenerEstadoPartido(partido) === 'finalizado'
  })

  for (const partido of partidosConResultado) {
    const resultado = prediccionesPorPartido
      ? prediccionesPorPartido.get(String(partido.id))
      : partido

    sumarResultado(
      tabla,
      partido,
      Number(resultado.golesLocal),
      Number(resultado.golesVisitante)
    )
  }

  return ordenarTabla(tabla)
}

export function calcularGrupos(partidos) {
  return obtenerGruposDisponibles(partidos, true).map((grupoId) => ({
    grupoId,
    tabla: calcularTablaGrupo(partidos, grupoId)
  }))
}
