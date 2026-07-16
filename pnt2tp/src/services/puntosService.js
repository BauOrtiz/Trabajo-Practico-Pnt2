import { obtenerPredicciones } from './prediccionesService'
import { calcularPuntosProde } from '../utils/puntuacionProde'

/**
 * Cruza de forma directa un array de predicciones con un array de partidos finalizados
 * para calcular los puntos obtenidos a través de tu motor matemático de puntuación (`puntuacionProde`).
 * 
 * @param {Array} predicciones - Apuestas a evaluar.
 * @param {Array} partidos - Partidos jugados (reales o virtuales).
 * @returns {number} Suma acumulada de puntos de esas apuestas.
 */
export function calcularPuntosDesdePredicciones(predicciones = [], partidos = []) {
  return calcularPuntosProde(predicciones, partidos)
}

/**
 * Obtiene las predicciones de un usuario específico desde el LocalStorage
 * y calcula de manera segura sus puntos acumulados hasta el momento.
 * 
 * @param {string|number} usuarioId - ID del usuario a consultar.
 * @param {Array} partidos - Lista de partidos (con los estados virtuales del Admin).
 * @returns {number} Puntaje total del usuario (0 si no existe el ID).
 */
export function calcularPuntosUsuario(usuarioId, partidos = []) {
  if (!usuarioId) return 0

  // 1. Buscamos en el disco local el historial de apuestas de este usuario en particular
  const predicciones = obtenerPredicciones(usuarioId)
  
  // 2. CORREGIDO: Llamamos a la función correcta declarada en este mismo archivo
  return calcularPuntosDesdePredicciones(predicciones, partidos)
}

/**
 * 🏆 EVALUADOR GENERAL DE LA COMUNIDAD:
 * Toma una lista completa de usuarios y recorre cada uno inyectándole
 * de forma reactiva la propiedad 'puntosTotales'.
 * 
 * @param {Array} usuarios - Listado de amigos de la base de datos.
 * @param {Array} partidos - Fixture de partidos con estados calculados.
 * @returns {Array} Nueva lista de usuarios donde cada uno incluye su propiedad 'puntosTotales'.
 */
export function calcularUsuariosConPuntos(usuarios = [], partidos = []) {
  return usuarios.map((usuario) => ({
    ...usuario,
    puntosTotales: calcularPuntosUsuario(usuario.id, partidos)
  }))
}