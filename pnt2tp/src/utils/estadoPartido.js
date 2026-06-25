function obtenerDuracionPartidoMs() {
  const horas = 2
  const minutosPorHora = 60
  const segundosPorMinuto = 60
  const milisegundosPorSegundo = 1000
  const duracionPartidoMs = horas * minutosPorHora * segundosPorMinuto * milisegundosPorSegundo

  return duracionPartidoMs
}

// Esta funcion calcula el estado del partido segun su horario
export function obtenerEstadoPartido(partido, ahora = new Date()) {
  const estadoApi = partido.estado?.toLowerCase()

  if (estadoApi === 'finalizado') {
    return 'finalizado'
  }

  const fechaPartido = partido.fechaHora || partido.fecha
  const inicio = new Date(fechaPartido)

  if (Number.isNaN(inicio.getTime())) {
    return partido.estado || 'programado'
  }

  const finalizacion = new Date(inicio.getTime() + obtenerDuracionPartidoMs())

  if (ahora >= finalizacion) {
    return 'finalizado'
  }

  if (ahora >= inicio) {
    return 'en vivo'
  }

  return 'programado'
}
