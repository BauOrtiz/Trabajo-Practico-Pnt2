// --- 🔑 CONSTANTES DE ALMACENAMIENTO (LOCALSTORAGE) ---
// Clave para guardar el objeto con todos los cambios manuales de fechas de los partidos
const CLAVE_CAMBIOS_FECHAS = 'prode_cambios_fechas_partidos'
// Clave para registrar de forma persistente si el admin forzó la finalización de la fase de grupos
const CLAVE_GRUPOS_FINALIZADOS = 'prode_fase_grupos_finalizada'

/**
 * Consulta si el administrador decidió finalizar de golpe toda la fase de grupos.
 * @returns {boolean} True si la fase está finalizada en el LocalStorage.
 */
export function faseGruposFinalizadaPorAdmin() {
  return localStorage.getItem(CLAVE_GRUPOS_FINALIZADOS) === 'true'
}

/**
 * Guarda en el disco local el estado que marca la fase de grupos como finalizada.
 */
export function guardarFaseGruposFinalizada() {
  localStorage.setItem(CLAVE_GRUPOS_FINALIZADOS, 'true')
}

/**
 * Remueve la marca de finalización de grupos para permitir restablecer el fixture.
 */
export function eliminarFaseGruposFinalizada() {
  localStorage.removeItem(CLAVE_GRUPOS_FINALIZADOS)
}

/**
 * ⚡ INTERCEPTOR DE ESTADO:
 * Recorre los partidos y, si la fase de grupos fue finalizada por el administrador,
 * fuerza que todos esos partidos pasen inmediatamente a estado 'finalizado'.
 * @param {Array} partidos - Lista original de partidos.
 * @returns {Array} Partidos actualizados con su estado forzado.
 */
export function aplicarEstadoFaseGrupos(partidos = []) {
  if (!faseGruposFinalizadaPorAdmin()) return partidos

  return partidos.map((partido) => ({
    ...partido,
    estado: 'finalizado',
    finalizadoPorAdmin: true // Flag útil para saber en la UI si el partido terminó por simulación
  }))
}
