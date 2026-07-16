/**
 * Helper: Genera la clave única (Key) para almacenar las predicciones en el LocalStorage.
 * Al incluir el 'usuarioId', logramos que cada usuario tenga su propio espacio aislado de apuestas,
 * evitando que se mezclen los datos si varias personas usan el mismo navegador.
 * 
 * @param {string|number} usuarioId - ID del usuario con sesión activa.
 * @returns {string|null} Clave generada (ej: "predicciones_usuario_123") o null si no hay id.
 */
function obtenerClavePredicciones(usuarioId) {
  return usuarioId ? `predicciones_usuario_${usuarioId}` : null
}

/**
 * Recupera el listado completo de predicciones de un usuario desde el almacenamiento local.
 * Implementa un bloque try/catch preventivo para evitar que el sistema se cuelgue si el JSON está corrupto.
 * 
 * @param {string|number} usuarioId - ID del usuario.
 * @returns {Array} Array de predicciones del usuario o un array vacío si no tiene o hay error.
 */
export function obtenerPredicciones(usuarioId) {
  const clave = obtenerClavePredicciones(usuarioId)
  if (!clave) return [] // Si no hay usuario, devolvemos un array vacío de manera segura

  try {
    const datosGuardados = localStorage.getItem(clave)
    if (!datosGuardados) return []

    const predicciones = JSON.parse(datosGuardados)
    // Nos aseguramos de que lo recuperado sea efectivamente un Array antes de retornarlo
    return Array.isArray(predicciones) ? predicciones : []
  } catch {
    return [] // Contingencia: si el parseo falla, devolvemos un array vacío de seguridad
  }
}

/**
 * Guarda o actualiza la lista completa de predicciones para un usuario en el almacenamiento local.
 * 
 * @param {Array} predicciones - El array de apuestas actualizado.
 * @param {string|number} usuarioId - ID del usuario dueño de las apuestas.
 */
export function guardarPredicciones(predicciones, usuarioId) {
  const clave = obtenerClavePredicciones(usuarioId)
  if (!clave) {
    throw new Error('Se necesita un usuario para guardar predicciones.')
  }

  // Mapeamos el array para inyectar y asegurar que cada apuesta tenga el 'usuarioId' correspondiente
  const prediccionesDelUsuario = predicciones.map((prediccion) => ({
    ...prediccion,
    usuarioId: String(usuarioId)
  }))

  // Guardamos el array serializado a formato texto JSON
  localStorage.setItem(clave, JSON.stringify(prediccionesDelUsuario))
}

/**
 * 🎯 GUARDADO O ACTUALIZACIÓN INDIVIDUAL:
 * Esta función es súper inteligente. Toma una única predicción y:
 * - Si el usuario ya había apostado en ese partido, edita los goles (actualiza).
 * - Si es la primera vez que apuesta en ese partido, crea un registro nuevo con un ID único (crea).
 * 
 * @param {Object} prediccion - Objeto con { partidoId, golesLocal, golesVisitante }.
 * @param {string|number} usuarioId - ID del usuario que realiza la apuesta.
 * @returns {Array} La lista completa y actualizada de predicciones del usuario.
 */
export function guardarPrediccion(prediccion, usuarioId) {
  if (!usuarioId) {
    throw new Error('Se necesita un usuario para guardar la predicción.')
  }

  // 1. Buscamos todas las predicciones que ya tenía guardadas este usuario
  const predicciones = obtenerPredicciones(usuarioId)
  
  // 2. Comprobamos si ya existía una apuesta previa para el mismo partido
  const indice = predicciones.findIndex(
    (item) => String(item.partidoId) === String(prediccion.partidoId)
  )

  if (indice >= 0) {
    // CASO A (Actualizar): Pisamos únicamente los goles de la predicción existente
    predicciones[indice] = {
      ...predicciones[indice],
      golesLocal: Number(prediccion.golesLocal),
      golesVisitante: Number(prediccion.golesVisitante)
    }
  } else {
    // CASO B (Crear): Agregamos un objeto nuevo con ID único (Date.now()) al listado
    predicciones.push({
      id: Date.now(),
      usuarioId: String(usuarioId),
      partidoId: prediccion.partidoId,
      golesLocal: Number(prediccion.golesLocal),
      golesVisitante: Number(prediccion.golesVisitante)
    })
  }

  // 3. Guardamos todo el array actualizado de vuelta en el LocalStorage
  guardarPredicciones(predicciones, usuarioId)
  
  return predicciones
}