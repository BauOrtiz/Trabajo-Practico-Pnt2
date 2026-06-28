const CLAVE_PREDICCIONES = 'predicciones'

export function obtenerPredicciones() {
  try {
    const datosGuardados = localStorage.getItem(CLAVE_PREDICCIONES)
    if (!datosGuardados) return []

    const predicciones = JSON.parse(datosGuardados)
    return Array.isArray(predicciones) ? predicciones : []
  } catch {
    return []
  }
}

export function guardarPredicciones(predicciones) {
  localStorage.setItem(CLAVE_PREDICCIONES, JSON.stringify(predicciones))
}

// Crea una prediccion o actualiza la existente para el mismo partido.
export function guardarPrediccion(prediccion) {
  const predicciones = obtenerPredicciones()
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
      partidoId: prediccion.partidoId,
      golesLocal: Number(prediccion.golesLocal),
      golesVisitante: Number(prediccion.golesVisitante)
    })
  }

  guardarPredicciones(predicciones)
  return predicciones
}
