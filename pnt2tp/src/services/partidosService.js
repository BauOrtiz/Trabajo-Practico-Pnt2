const API_URL = 'https://6a1627131b90031f81b0b808.mockapi.io/api/v1/partidos'

export async function obtenerPartidos() {
  const respuesta = await fetch(API_URL)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  return await respuesta.json()
}