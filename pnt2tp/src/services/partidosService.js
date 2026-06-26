const API_URL = 'https://www.mockachino.com/603fe2b3-50c8-44/partidos'

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
    estado: partido.estado?.toLowerCase() ?? 'programado',
    partidoOriginal: partido
  }
}

export async function obtenerPartidos() {
  const respuesta = await fetch(API_URL)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  const data = await respuesta.json()
  const partidos = data.partidos ?? []

  return partidos.map(normalizarPartido)
}


//Link espacio crear mockachinos: https://www.mockachino.com/spaces/603fe2b3-50c8-44
const API_PARTIDOS = API_URL

export async function obtenerPartidos2() {
  const respuesta = await fetch(API_PARTIDOS)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  return await respuesta.json()
}


const API_SELECCIONES = 'https://www.mockachino.com/603fe2b3-50c8-44/selecciones'

export async function obtenerSelecciones() {
  const respuesta = await fetch(API_SELECCIONES)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las selecciones')
  }

  const data = await respuesta.json()

  return data
}

const API_ESTADIOS = 'https://www.mockachino.com/603fe2b3-50c8-44/estadios'

export async function obtenerEstadios() {
  const respuesta = await fetch(API_ESTADIOS)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los Estadios')
  }

    return await respuesta.json()


}

