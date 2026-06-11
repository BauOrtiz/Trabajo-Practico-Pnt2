const API_URL = 'https://6a1627131b90031f81b0b808.mockapi.io/api/v1/partidos'

export async function obtenerPartidos() {
  const respuesta = await fetch(API_URL)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  return await respuesta.json()
}


const API_SELECCIONES = 'https://www.mockachino.com/603fe2b3-50c8-44/selecciones'

export async function obtenerSelecciones() {
  const respuesta = await fetch(API_SELECCIONES)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

    return await respuesta.json()


}

