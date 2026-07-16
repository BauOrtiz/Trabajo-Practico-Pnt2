
/**
 * Helper: Crea la estructura inicial con valores en cero para un equipo de fútbol.
 * Esto evita tener que declarar manualmente las propiedades cada vez que agregamos un club a la tabla.
 * @param {string} nombre - Nombre del país/selección.
 * @returns {Object} Estructura inicial del equipo para la tabla.
 */
function crearEquipo(nombre) {
  return {
    nombre,
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    golesFavor: 0,
    golesContra: 0,
    diferenciaGol: 0,
    puntos: 0
  }
}

/**
 * Helper: Suma los puntos, partidos y goles de un encuentro a los registros de la tabla.
 * @param {Map} tabla - El mapa con los datos acumulados de los equipos del grupo.
 * @param {Object} partido - Objeto del partido para saber qué equipos se enfrentan.
 * @param {number} golesLocal - Cantidad de goles marcados por el equipo local.
 * @param {number} golesVisitante - Cantidad de goles marcados por el equipo visitante.
 */
function sumarResultado(tabla, partido, golesLocal, golesVisitante) {
  // Buscamos las referencias de los equipos en el mapa
  const local = tabla.get(partido.equipoLocal)
  const visitante = tabla.get(partido.equipoVisitante)

  // Incrementamos partidos jugados
  local.jugados += 1
  visitante.jugados += 1
  
  // Sumamos estadísticas de goles
  local.golesFavor += golesLocal
  local.golesContra += golesVisitante
  visitante.golesFavor += golesVisitante
  visitante.golesContra += golesLocal

  // Estructura de control para asignar los 3, 1 o 0 puntos correspondientes
  if (golesLocal > golesVisitante) {
    // Victoria Local
    local.ganados += 1
    visitante.perdidos += 1
    local.puntos += 3
  } else if (golesLocal < golesVisitante) {
    // Victoria Visitante
    visitante.ganados += 1
    local.perdidos += 1
    visitante.puntos += 3
  } else {
    // Empate
    local.empatados += 1
    visitante.empatados += 1
    local.puntos += 1
    visitante.puntos += 1
  }

  // Recalculamos la diferencia de gol de ambos planteles ($DG = GF - GC$)
  local.diferenciaGol = local.golesFavor - local.golesContra
  visitante.diferenciaGol = visitante.golesFavor - visitante.golesContra
}

/**
 * Aplica los criterios oficiales de desempate de la FIFA de forma estricta:
 * 1. Puntos
 * 2. Diferencia de gol
 * 3. Goles a favor
 * 4. Criterio de desempate por orden alfabético
 * @param {Map} tabla - Mapa desordenado de los equipos.
 * @returns {Array} Array ordenado listo para renderizar en la vista.
 */
function ordenarTabla(tabla) {
  return [...tabla.values()].sort((a, b) => {
    // Criterio 1: Mayor cantidad de puntos
    if (b.puntos !== a.puntos) return b.puntos - a.puntos
    
    // Criterio 2: Mayor diferencia de gol
    if (b.diferenciaGol !== a.diferenciaGol) {
      return b.diferenciaGol - a.diferenciaGol
    }
    
    // Criterio 3: Mayor cantidad de goles a favor
    if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor
    
    // Criterio 4: Desempate alfabético por nombre del país
    return a.nombre.localeCompare(b.nombre)
  })
}

/**
 * Analiza el array de partidos y extrae de forma única los grupos disponibles (A, B, C, etc.)
 * @param {Array} partidos - Fixture total de partidos.
 * @param {boolean} incluirEliminatorias - Si es false, ignora la etapa eliminatoria directa ("KO").
 * @returns {Array} Listado de letras de grupos ordenadas de forma alfabética sin duplicados.
 */
export function obtenerGruposDisponibles(partidos, incluirEliminatorias = false) {
  const grupos = partidos
    .map((partido) => partido.grupoId || 'Sin grupo')
    // Descartamos la etapa de eliminación (KO) a menos que se indique lo contrario
    .filter((grupoId) => incluirEliminatorias || grupoId !== 'KO')

  // Usamos 'new Set()' para eliminar automáticamente duplicados de grupos en el array
  return [...new Set(grupos)].sort((a, b) =>
    String(a).localeCompare(String(b))
  )
}

/**
 * ⚽ LA FUNCIÓN ESTRELLA:
 * Calcula la tabla de posiciones de un grupo específico. 
 * Si se le pasan predicciones, arma la "tabla apostada" del Prode. 
 * Si no se le pasan predicciones, calcula la "tabla de posiciones real" del mundial.
 * 
 * @param {Array} partidos - Lista de partidos desde el store (con estados calculados).
 * @param {string} grupoId - Letra del grupo que se desea calcular (ej: 'A', 'B').
 * @param {Array|null} predicciones - Apuestas guardadas del usuario o null.
 * @returns {Array} Tabla ordenada de posiciones del grupo.
 */
export function calcularTablaGrupo(partidos, grupoId, predicciones = null) {
  // 1. Filtramos los partidos para quedarnos únicamente con los del grupo indicado
  const partidosDelGrupo = partidos.filter(
    (partido) => (partido.grupoId || 'Sin grupo') === grupoId
  )
  
  // Usamos un Map para almacenar los equipos de forma temporal
  const tabla = new Map()

  // Aseguramos que todos los equipos del grupo estén registrados en el Map con estadísticas en cero
  for (const partido of partidosDelGrupo) {
    if (!tabla.has(partido.equipoLocal)) {
      tabla.set(partido.equipoLocal, crearEquipo(partido.equipoLocal))
    }
    if (!tabla.has(partido.equipoVisitante)) {
      tabla.set(partido.equipoVisitante, crearEquipo(partido.equipoVisitante))
    }
  }

  // Si nos pasaron predicciones, las convertimos en un Map indexado por 'partidoId' para búsquedas O(1) veloces
  const prediccionesPorPartido = predicciones
    ? new Map(
        predicciones.map((prediccion) => [
          String(prediccion.partidoId),
          prediccion
        ])
      )
    : null

  // 2. Filtramos qué partidos se van a procesar para alterar los puntos:
  // - Si estamos proyectando (Prode): se procesan los partidos donde el usuario guardó un pronóstico.
  // - Si es la tabla Real: se procesan únicamente los partidos cuyo estado simulado es 'finalizado'.
  const partidosConResultado = partidosDelGrupo.filter((partido) => {
    if (prediccionesPorPartido) {
      return prediccionesPorPartido.has(String(partido.id))
    }

      return partido.estado === 'finalizado'
  })

  // 3. Procesamos los partidos válidos uno a uno acumulando goles, puntos y diferencias
  for (const partido of partidosConResultado) {
    // Si proyectamos, los goles se leen del pronóstico del usuario; si no, del partido real
    const resultado = prediccionesPorPartido
      ? prediccionesPorPartido.get(String(partido.id))
      : partido

    sumarResultado(
      tabla,
      partido,
      Number(resultado.golesLocal),
      Number(resultado.golesVisitante)
    )
  }

  // 4. Retornamos los equipos ordenados de manera oficial
  return ordenarTabla(tabla)
}

/**
 * Calcula de golpe las tablas de posiciones de todos los grupos del fixture de manera iterativa.
 * @param {Array} partidos - El listado total de partidos.
 * @returns {Array} Un array de objetos conteniendo el ID del grupo y su tabla ordenada correspondiente.
 */
export function calcularGrupos(partidos) {
  return obtenerGruposDisponibles(partidos, true).map((grupoId) => ({
    grupoId,
    tabla: calcularTablaGrupo(partidos, grupoId)
  }))
}