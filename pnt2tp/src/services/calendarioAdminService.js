const CLAVE_CAMBIOS_FECHAS = 'prode_cambios_fechas_partidos'

export function obtenerCambiosFechaPartidos() {
  try {
    const datosGuardados = localStorage.getItem(CLAVE_CAMBIOS_FECHAS)
    const cambios = datosGuardados ? JSON.parse(datosGuardados) : {}

    return cambios && typeof cambios === 'object' ? cambios : {}
  } catch {
    return {}
  }
}

export function aplicarCambiosFechaPartidos(partidos = []) {
  const cambios = obtenerCambiosFechaPartidos()

  return partidos.map((partido) => {
    const fechaAdmin = cambios[String(partido.id)]

    if (!fechaAdmin) return partido

    return {
      ...partido,
      fecha: fechaAdmin,
      fechaHora: fechaAdmin,
      fechaModificadaPorAdmin: true
    }
  })
}

export function guardarCambioFechaPartido(partidoId, nuevaFecha) {
  const cambios = obtenerCambiosFechaPartidos()

  cambios[String(partidoId)] = nuevaFecha
  localStorage.setItem(CLAVE_CAMBIOS_FECHAS, JSON.stringify(cambios))

  return cambios
}

export function eliminarCambioFechaPartido(partidoId) {
  const cambios = obtenerCambiosFechaPartidos()

  delete cambios[String(partidoId)]
  localStorage.setItem(CLAVE_CAMBIOS_FECHAS, JSON.stringify(cambios))

  return cambios
}

export function eliminarCambiosFechaPartidos() {
  localStorage.removeItem(CLAVE_CAMBIOS_FECHAS)
}
