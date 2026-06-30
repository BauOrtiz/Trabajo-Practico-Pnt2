function obtenerClavePredicciones(usuarioId) {
  return usuarioId ? `predicciones_usuario_${usuarioId}` : null
}

export function obtenerPredicciones(usuarioId) {
  const clave = obtenerClavePredicciones(usuarioId)
  if (!clave) return []

  try {
    const datosGuardados = localStorage.getItem(clave)
    if (!datosGuardados) return []

    const predicciones = JSON.parse(datosGuardados)
    return Array.isArray(predicciones) ? predicciones : []
  } catch {
    return []
  }
}

export function guardarPredicciones(predicciones, usuarioId) {
  const clave = obtenerClavePredicciones(usuarioId)
  if (!clave) {
    throw new Error('Se necesita un usuario para guardar predicciones.')
  }

  const prediccionesDelUsuario = predicciones.map((prediccion) => ({
    ...prediccion,
    usuarioId: String(usuarioId)
  }))

  localStorage.setItem(clave, JSON.stringify(prediccionesDelUsuario))
}

// Crea una prediccion o actualiza la existente para el mismo partido.
export function guardarPrediccion(prediccion, usuarioId) {
  if (!usuarioId) {
    throw new Error('Se necesita un usuario para guardar la predicción.')
  }

  const predicciones = obtenerPredicciones(usuarioId)
  const indice = predicciones.findIndex(
    (item) => String(item.partidoId) === String(prediccion.partidoId)
  )

  if (indice >= 0) {
    predicciones[indice] = {
      ...predicciones[indice],
      golesLocal: Number(prediccion.golesLocal),
      golesVisitante: Number(prediccion.golesVisitante)
    }
  } else {
    predicciones.push({
      id: Date.now(),
      usuarioId: String(usuarioId),
      partidoId: prediccion.partidoId,
      golesLocal: Number(prediccion.golesLocal),
      golesVisitante: Number(prediccion.golesVisitante)
    })
  }

  guardarPredicciones(predicciones, usuarioId)
  return predicciones
}
