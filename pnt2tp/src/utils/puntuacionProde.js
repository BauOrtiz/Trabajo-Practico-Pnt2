
function resultado(golesLocal, golesVisitante) {
  if (golesLocal > golesVisitante) return 'local'
  if (golesLocal < golesVisitante) return 'visitante'
  return 'empate'
}


export function calcularPuntosPrediccion(prediccion, partido) {
  if (!prediccion || !partido || partido.estado !== 'finalizado') {
    return 0
  }

  const golesPredichosLocal = Number(prediccion.golesLocal)
  const golesPredichosVisitante = Number(prediccion.golesVisitante)
  const golesRealesLocal = Number(partido.golesLocal)
  const golesRealesVisitante = Number(partido.golesVisitante)


  if (
    golesPredichosLocal === golesRealesLocal &&
    golesPredichosVisitante === golesRealesVisitante
  ) {
    return 3
  }

  const resultadoPredicho = resultado(golesPredichosLocal, golesPredichosVisitante)
  const resultadoReal = resultado(golesRealesLocal, golesRealesVisitante)


  return resultadoPredicho === resultadoReal ? 1 : 0
}


export function calcularPuntosProde(predicciones, partidos) {

  const partidosPorId = new Map(
    partidos.map((partido) => [String(partido.id), partido])
  )

  return predicciones.reduce((total, prediccion) => {
    const partido = partidosPorId.get(String(prediccion.partidoId))
    return total + calcularPuntosPrediccion(prediccion, partido)
  }, 0)
}
