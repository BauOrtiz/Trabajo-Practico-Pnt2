const API_URL = 'https://www.mockachino.com/603fe2b3-50c8-44/partidos'
const API_ELIMINATORIAS_URL = 'https://www.mockachino.com/603fe2b3-50c8-44/partidos-eliminatorias'

function normalizarPartido(partido, index) {
  return {
    id: partido.id || `${partido.localId}-${partido.visitanteId}-${index}`, //si la api no trae id, se arma uno
    grupoId: partido.grupo,
    equipoLocal: partido.localId,
    equipoVisitante: partido.visitanteId,
    golesLocal: partido.resultadoReal?.golesLocal ?? 0,
    golesVisitante: partido.resultadoReal?.golesVisitante ?? 0,
    fecha: partido.fechaHora,
    fechaTorneo: partido.fechaTorneo,
    fase: partido.fase || 'FASE_GRUPOS',
    estado: partido.estado?.toLowerCase() ?? 'programado',
    partidoOriginal: partido
  }
}

async function obtenerPartidosDesde(url) {
  const respuesta = await fetch(url,{
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  const data = await respuesta.json()
  const partidos = data.partidos ?? []
  return partidos.map(normalizarPartido)
}

export function obtenerPartidos() {
  return obtenerPartidosDesde(API_URL)
}

export function obtenerPartidosEliminatorias() {
  return obtenerPartidosDesde(API_ELIMINATORIAS_URL)
}

const API_SELECCIONES = 'https://www.mockachino.com/603fe2b3-50c8-44/selecciones'

export async function obtenerSelecciones() {
  const respuesta = await fetch(API_SELECCIONES,{
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las selecciones')
  }

  const data = await respuesta.json()

  return data
}

const API_ESTADIOS = 'https://www.mockachino.com/603fe2b3-50c8-44/estadios'

export async function obtenerEstadios() {
  const respuesta = await fetch(API_ESTADIOS,{
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los Estadios')
  }

    return await respuesta.json()


}

