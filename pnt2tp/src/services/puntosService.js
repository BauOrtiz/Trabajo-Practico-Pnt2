import { obtenerPredicciones } from './prediccionesService'
import { calcularPuntosProde } from '../utils/puntuacionProde'

export function calcularPuntosDesdePredicciones(predicciones = [], partidos = []) {
  return calcularPuntosProde(predicciones, partidos)
}

export function calcularPuntosUsuario(usuarioId, partidos = []) {
  if (!usuarioId) return 0

  const predicciones = obtenerPredicciones(usuarioId)
  return calcularPuntosDesdePredicciones(predicciones, partidos)
}

export function calcularUsuariosConPuntos(usuarios = [], partidos = []) {
  return usuarios.map((usuario) => ({
    ...usuario,
    puntosTotales: calcularPuntosUsuario(usuario.id, partidos)
  }))
}
