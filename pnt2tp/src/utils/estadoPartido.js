function obtenerDuracionPartidoMs() {
  const minutos = 2
  const segundosPorMinuto = 60
  const milisegundosPorSegundo = 1000
  const duracionPartidoMs = minutos * segundosPorMinuto * milisegundosPorSegundo

  return duracionPartidoMs
}

// Respeta los estados programado y finalizado informados por la API.
// Solo calcula el fin automatico de los partidos que estan en vivo.
export function obtenerEstadoPartido(partido, ahora = new Date()) {
  const estadoApi = partido?.estado?.toLowerCase() ?? 'programado'

  if (estadoApi === 'pendiente') {
    return 'programado'
  }

  if (estadoApi === 'finalizado') {
    return 'finalizado'
  }

  if (estadoApi !== 'en vivo') {
    return estadoApi
  }

  const fechaPartido = partido.fechaHora || partido.fecha
  const inicio = new Date(fechaPartido)

  if (Number.isNaN(inicio.getTime())) {
    return 'en vivo'
  }

  const finalizacion = new Date(inicio.getTime() + obtenerDuracionPartidoMs())

  if (ahora >= finalizacion) {
    return 'finalizado'
  }

  return 'en vivo'
}
