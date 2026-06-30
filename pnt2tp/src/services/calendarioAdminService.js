const CLAVE_CAMBIOS_FECHAS = 'prode_cambios_fechas_partidos'
const CLAVE_GRUPOS_FINALIZADOS = 'prode_fase_grupos_finalizada'

export function faseGruposFinalizadaPorAdmin() {
  return localStorage.getItem(CLAVE_GRUPOS_FINALIZADOS) === 'true'
}

export function guardarFaseGruposFinalizada() {
  localStorage.setItem(CLAVE_GRUPOS_FINALIZADOS, 'true')
}

export function eliminarFaseGruposFinalizada() {
  localStorage.removeItem(CLAVE_GRUPOS_FINALIZADOS)
}

export function aplicarEstadoFaseGrupos(partidos = []) {
  if (!faseGruposFinalizadaPorAdmin()) return partidos

  return partidos.map((partido) => ({
    ...partido,
    estado: 'finalizado',
    finalizadoPorAdmin: true
  }))
}

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
