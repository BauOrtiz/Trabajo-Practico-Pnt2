function obtenerDuracionPartidoMs() {
  const minutos = 2
  const segundosPorMinuto = 60
  const milisegundosPorSegundo = 1000
  const duracionPartidoMs = minutos * segundosPorMinuto * milisegundosPorSegundo

  return duracionPartidoMs
}

function calcularEstadoPorFecha(partido, ahora) {
  const fechaPartido = partido.fechaHora || partido.fecha
  const inicio = new Date(fechaPartido)

  if (Number.isNaN(inicio.getTime())) {
    return 'programado'
  }

  const finalizacion = new Date(inicio.getTime() + obtenerDuracionPartidoMs())

  if (ahora < inicio) {
    return 'programado'
  }

  if (ahora >= finalizacion) {
    return 'finalizado'
  }

  return 'en vivo'
}

// Si la API marca finalizado, se respeta.
// Para pendiente, programado o en vivo, se calcula el estado segun la fecha.
export function obtenerEstadoPartido(partido, ahora = new Date()) {
  const estadoApi = partido?.estado?.toLowerCase() ?? 'programado'

  if (estadoApi === 'finalizado') {
    return 'finalizado'
  }

  return calcularEstadoPorFecha(partido, ahora)
}
