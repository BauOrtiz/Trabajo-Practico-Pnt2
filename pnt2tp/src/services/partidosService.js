const API_URL = 'https://6a1627131b90031f81b0b808.mockapi.io/api/v1/partidos'

export async function obtenerPartidos() {
  const respuesta = await fetch(API_URL)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los partidos')
  }

  return await respuesta.json()
}


//Link espacio crear mochachinos: https://www.mockachino.com/spaces/603fe2b3-50c8-44
const API_PARTIDOS = 'https://www.mockachino.com/603fe2b3-50c8-44/partidos'

export async function obtenerPartidos2() {

  try{
      const respuesta = await fetch(API_PARTIDOS)

      if (!respuesta.ok) {
        throw new Error('No se pudieron obtener los partidos')
      }
  }catch(error){
    console.error("Error al traer los estadios", error)
  } finally {
    loading.value = false
  }
  

  return await respuesta.json()
}


const API_SELECCIONES = 'https://www.mockachino.com/603fe2b3-50c8-44/selecciones'

export async function obtenerSelecciones() {
  const respuesta = await fetch(API_SELECCIONES)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener las Selecciones')
  }

    return await respuesta.json()


}

const API_ESTADIOS = 'https://www.mockachino.com/603fe2b3-50c8-44/estadios'

export async function obtenerEstadios() {
  const respuesta = await fetch(API_ESTADIOS)

  if (!respuesta.ok) {
    throw new Error('No se pudieron obtener los Estadios')
  }

    return await respuesta.json()


}

