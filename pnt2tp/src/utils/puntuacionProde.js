import { obtenerEstadoPartido } from './estadoPartido'

// Devuelve quien gano el partido segun los goles.
function resultado(golesLocal, golesVisitante) {
  if (golesLocal > golesVisitante) return 'local'
  if (golesLocal < golesVisitante) return 'visitante'
  return 'empate'
}

// Calcula los puntos de una prediccion contra un partido real.
export function calcularPuntosPrediccion(prediccion, partido) {
  if (!prediccion || !partido || obtenerEstadoPartido(partido) !== 'finalizado') {
    return 0
  }

  const golesPredichosLocal = Number(prediccion.golesLocal)
  const golesPredichosVisitante = Number(prediccion.golesVisitante)
  const golesRealesLocal = Number(partido.golesLocal)
  const golesRealesVisitante = Number(partido.golesVisitante)

  // Resultado exacto: mismo marcador que el partido real.
  if (
    golesPredichosLocal === golesRealesLocal &&
    golesPredichosVisitante === golesRealesVisitante
  ) {
    return 3
  }

  const resultadoPredicho = resultado(golesPredichosLocal, golesPredichosVisitante)
  const resultadoReal = resultado(golesRealesLocal, golesRealesVisitante)

  // Resultado correcto: acerto ganador o empate, pero no el marcador exacto.
  return resultadoPredicho === resultadoReal ? 1 : 0
}

// Suma los puntos de todas las predicciones del usuario.
export function calcularPuntosProde(predicciones, partidos) {
  // Permite encontrar rapido el partido real usando el id guardado en la prediccion.
  const partidosPorId = new Map(
    partidos.map((partido) => [String(partido.id), partido])
  )

  return predicciones.reduce((total, prediccion) => {
    const partido = partidosPorId.get(String(prediccion.partidoId))
    return total + calcularPuntosPrediccion(prediccion, partido)
  }, 0)
}
