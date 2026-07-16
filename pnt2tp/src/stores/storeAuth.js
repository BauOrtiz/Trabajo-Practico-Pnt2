import { defineStore } from 'pinia'
import {
  ADMINISTRADORES_HARDCODEADOS,
  NOMBRES_ROLES,
  ROLES
} from '../data/roles'

// --- 🌐 API ENDPOINT ---
// Base de datos de MockAPI donde se consultan, registran y actualizan los usuarios del Prode
const API_USUARIOS = 'https://6a2b1b9ab687a7d5cbc4de36.mockapi.io/prode/Usuarios'

/**
 * Helper: Normaliza un correo electrónico eliminando espacios vacíos 
 * en los extremos y pasándolo completamente a letras minúsculas.
 * @param {string} email - Correo a normalizar.
 * @returns {string} Correo limpio y en minúsculas.
 */
function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/**
 * Helper: Asegura que el objeto usuario tenga un rol asignado por defecto
 * si es que la base de datos o la API no lo trae explícitamente.
 * @param {Object} usuario - Datos del usuario.
 * @returns {Object|null} Usuario con rol de seguridad garantizado o null.
 */
function normalizarUsuario(usuario) {
  if (!usuario) return null

  return {
    ...usuario,
    rol: usuario.rol || ROLES.USUARIO
  }
}

/**
 * Helper: Intenta recuperar y validar la sesión persistida del usuario en LocalStorage.
 * Si detecta que la estructura del JSON está rota o el ID del usuario falta,
 * limpia de manera automática el disco para evitar inconsistencias de inicio.
 * @returns {Object|null} El usuario recuperado y normalizado, o null.
 */
function obtenerUsuarioGuardado() {
  const usuarioGuardado = localStorage.getItem('prode_user')

  if (!usuarioGuardado) return null

  try {
    const parsed = JSON.parse(usuarioGuardado)
    if (!parsed?.id) {
      localStorage.removeItem('prode_user')
      return null
    }
    return normalizarUsuario(parsed)
  } catch {
    localStorage.removeItem('prode_user')
    return null
  }
}

/**
 * Helper: Compara un correo contra el listado de administradores hardcodeados en el sistema
 * para determinar si el usuario que intenta ingresar posee permisos de administración.
 * @param {string} email - Correo provisto en el Login.
 * @returns {Object|undefined} El objeto del administrador correspondiente si existe coincidencia.
 */
function buscarAdminHardcodeado(email) {
  const emailNormalizado = normalizarEmail(email)

  return ADMINISTRADORES_HARDCODEADOS.find(
    (admin) => normalizarEmail(admin.email) === emailNormalizado
  )
}

/**
 * Helper: Actualiza de forma unificada el estado del store de Pinia
 * y persiste de forma síncrona los datos del usuario en el LocalStorage.
 * @param {Object} store - Referencia dinámica del store 'this'.
 * @param {Object} usuario - El usuario autenticado que se desea guardar.
 */
function guardarSesion(store, usuario) {
  const usuarioNormalizado = normalizarUsuario(usuario)

  store.user = usuarioNormalizado
  localStorage.setItem('prode_user', JSON.stringify(usuarioNormalizado))
}

// --- 🍍 STORE PRINCIPAL DE PINIA ---
export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Levanta reactivamente la sesión guardada para no forzar re-logueos al recargar
    user: obtenerUsuarioGuardado(),
    loading: false, // Control de spinner global en transacciones de login/registro/perfil
    error: null     // Almacén dinámico para mensajes de error de red o autenticación
  }),

  getters: {
    // Retorna true si hay un objeto de usuario en el estado
    isLoggedIn: (state) => !!state.user,
    // Valida si el rol del usuario actual es estrictamente Administrador
    isAdmin: (state) => state.user?.rol === ROLES.ADMIN,
    // Valida si el rol del usuario actual es estrictamente Usuario regular
    isUsuario: (state) => state.user?.rol === ROLES.USUARIO,
    // Traduce la constante del rol a un texto legible para mostrar en pantalla (ej: "Administrador")
    nombreRol: (state) => NOMBRES_ROLES[state.user?.rol] || NOMBRES_ROLES[ROLES.USUARIO]
  },

  actions: {
    /**
     * Acción: Procesa el inicio de sesión.
     * Evalúa primero si el email pertenece a un administrador local hardcodeado.
     * Si no, efectúa una búsqueda en MockAPI para validar el registro y contraseña.
     */
    async login(email, password) {
      this.loading = true
      this.error = null

      try {
        // 1. Verificación de Administradores locales
        const adminHardcodeado = buscarAdminHardcodeado(email)

        if (adminHardcodeado) {
          if (adminHardcodeado.password !== password) {
            throw new Error('Contraseña incorrecta.')
          }

          guardarSesion(this, adminHardcodeado)
          return true
        }

        // 2. Consulta al servidor para Usuarios regulares
        const response = await fetch(`${API_USUARIOS}?email=${encodeURIComponent(email)}`)
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor de usuarios.')
        }

        const data = await response.json()
        const users = Array.isArray(data) ? data : [data]
        
        // Buscamos coincidencia exacta de email para evitar falsos positivos
        const usuarioBuscado = users.find(
          (usuario) => normalizarEmail(usuario.email) === normalizarEmail(email)
        )

        if (!usuarioBuscado) {
          throw new Error('El usuario no existe.')
        }

        if (usuarioBuscado.password !== password) {
          throw new Error('Contraseña incorrecta.')
        }

        guardarSesion(this, usuarioBuscado)
        return true
      } catch (err) {
        this.error = err.message || 'Error en el servidor.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Acción: Registra un nuevo usuario en la base de datos de MockAPI.
     * Por cuestiones de seguridad, bloquea el uso de correos reservados para administradores.
     */
    async register(nombre, email, password) {
      this.loading = true
      this.error = null

      try {
        // Validación de bloqueo: no permite registrar cuentas con emails de administradores locales
        if (buscarAdminHardcodeado(email)) {
          throw new Error('Ese email esta reservado para administradores.')
        }

        const nuevoUsuario = {
          nombre,
          email,
          password,
          rol: ROLES.USUARIO,
          puntosTotales: 0
        }

        const response = await fetch(API_USUARIOS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nuevoUsuario)
        })

        if (!response.ok) {
          throw new Error('No se pudo registrar el usuario.')
        }

        const datoGuardado = await response.json()

        guardarSesion(this, datoGuardado)
        return true
      } catch (err) {
        this.error = err.message || 'No se pudo registrar el usuario.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Acción: Destruye el estado de sesión en memoria y remueve el token local del disco.
     */
    logout() {
      this.user = null
      localStorage.removeItem('prode_user')
    },

    /**
     * Acción: Envía mediante el método PUT los nuevos datos personales del usuario a MockAPI,
     * actualizando de forma inmediata el almacenamiento local al recibir éxito del servidor.
     */
    async actualizarPerfil(datosActualizados) {
      this.loading = true
      this.error = null

      try {
        if (!this.user?.id) {
          throw new Error('No hay un usuario logueado.')
        }

        const response = await fetch(`${API_USUARIOS}/${this.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...this.user,
            ...datosActualizados
          })
        })

        if (!response.ok) {
          throw new Error('No se pudieron actualizar los datos del perfil.')
        }

        const usuarioActualizado = await response.json()

        this.user = usuarioActualizado
        localStorage.setItem('prode_user', JSON.stringify(usuarioActualizado))

        return true
      } catch (err) {
        this.error = err.message || 'Error al actualizar el perfil.'
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Acción: Valida la contraseña antigua y efectúa el cambio por una nueva clave en el servidor
     * de forma independiente y segura.
     */
    async cambiarPassword(passwordActual, passwordNueva) {
      this.loading = true
      this.error = null

      try {
        if (!this.user?.id) {
          throw new Error('No hay un usuario logueado.')
        }

        if (this.user.password !== passwordActual) {
          throw new Error('La contraseña actual no es correcta.')
        }

        const response = await fetch(`${API_USUARIOS}/${this.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...this.user,
            password: passwordNueva
          })
        })

        if (!response.ok) {
          throw new Error('No se pudo cambiar la contraseña.')
        }

        const usuarioActualizado = await response.json()

        this.user = usuarioActualizado
        localStorage.setItem('prode_user', JSON.stringify(usuarioActualizado))

        return true
      } catch (err) {
        this.error = err.message || 'Error al cambiar la contraseña.'
        return false
      } finally {
        this.loading = false
      }
    }
  }
})