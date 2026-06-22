const DURACION_PARTIDO_MS = 2 * 60 * 60 * 1000

// Esta funcion calcula el estado del partido segun su horario.
export function obtenerEstadoPartido(partido, ahora = new Date()) {
  const fechaPartido = partido.fechaHora || partido.fecha
  const inicio = new Date(fechaPartido)

  if (Number.isNaN(inicio.getTime())) {
    return partido.estado || 'programado'
  }

  const finalizacion = new Date(inicio.getTime() + DURACION_PARTIDO_MS)

  if (ahora >= finalizacion) {
    return 'finalizado'
  }

  if (ahora >= inicio) {
    return 'en vivo'
  }

  return 'programado'
}
