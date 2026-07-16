

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
