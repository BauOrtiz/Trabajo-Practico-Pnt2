// --- 🌐 1. ENDPOINTS DE LA API (MOCKACHINO) ---
// URL para traer el fixture de la fase de grupos
const API_URL = 'https://www.mockachino.com/603fe2b3-50c8-44/partidos'
// URL para traer las llaves de eliminación directa (Octavos, Cuartos, etc.)
const API_ELIMINATORIAS_URL = 'https://www.mockachino.com/603fe2b3-50c8-44/partidos-eliminatorias'
// URL para traer el listado de selecciones nacionales, planteles y directores técnicos
const API_SELECCIONES = 'https://www.mockachino.com/603fe2b3-50c8-44/selecciones'
// URL para traer el listado de estadios sedes del Mundial
const API_ESTADIOS = 'https://www.mockachino.com/603fe2b3-50c8-44/estadios'


/**
 * 🛠️ FUNCIÓN DE NORMALIZACIÓN:
 * Es un "traductor de datos". Toma la estructura cruda que devuelve la API y la convierte
 * en un objeto limpio, uniforme y fácil de usar en tus componentes Vue.
 * 
 * Por ejemplo: si la API no trae un ID único para un partido, esta función lo autogenera
 * combinando las iniciales de los rivales y el índice del array, evitando que Vue tenga
 * problemas de renderizado con los `:key` en los `v-for`.
 * 
 * @param {Object} partido - Datos crudos del partido traídos del servidor.
 * @param {number} index - Posición en el array (usado como plan de respaldo para el ID).
 * @returns {Object} Partido con estructura unificada y valores por defecto seguros.
 */
function normalizarPartido(partido, index) {
  return {
    // Si la API no trae id de partido, armamos uno único combinando local-visitante-indice
    id: partido.id || `${partido.localId}-${partido.visitanteId}-${index}`, 
    grupoId: partido.grupo,
    equipoLocal: partido.localId,
    equipoVisitante: partido.visitanteId,
    // Operadores de coalescencia nula (??) para evitar "undefined" o campos vacíos
    golesLocal: partido.resultadoReal?.golesLocal ?? 0,
    golesVisitante: partido.resultadoReal?.golesVisitante ?? 0,
    fecha: partido.fechaHora,
    fechaTorneo: partido.fechaTorneo,
    fase: partido.fase || 'FASE_GRUPOS',
    estado: partido.estado?.toLowerCase() ?? 'programado',
    partidoOriginal: partido // Guardamos por las dudas una copia del objeto original intacto
  }
}

/**
 * Helper genérico asíncrono para consumir partidos utilizando el método Fetch.
 * @param {string} url - El endpoint al que le vamos a pegar.
 * @returns {Promise<Array>} Array de partidos ya normalizados y listos para usar.
 */
async function obtenerPartidosDesde(url) {
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  // Control de errores de red clásico
  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  const data = await respuesta.json()
  const partidos = data.partidos ?? []
  
  // Retorna los partidos pasándolos primero por nuestro traductor (normalizarPartido)
  return partidos.map(normalizarPartido)
}

// --- ⚽ 2. EXPORTACIÓN DE MÉTODOS DE LA API ---

/**
 * Trae y normaliza los partidos de la Fase de Grupos.
 */
export function obtenerPartidos() {
  return obtenerPartidosDesde(API_URL)
}

/**
 * Trae y normaliza los partidos de las llaves Eliminatorias (Playoffs).
 */
export function obtenerPartidosEliminatorias() {
  return obtenerPartidosDesde(API_ELIMINATORIAS_URL)
}

/**
 * Trae la información de todas las Selecciones (plantel, bandera, entrenador, etc.).
 */
export async function obtenerSelecciones() {
  const respuesta = await fetch(API_SELECCIONES, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las selecciones')
  }

  const data = await respuesta.json()
  return data
}

/**
 * Trae el listado completo de los Estadios del torneo con sus fotos, ciudades y capacidades.
 */
export async function obtenerEstadios() {
  const respuesta = await fetch(API_ESTADIOS, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los Estadios')
  }

  return await respuesta.json()
}