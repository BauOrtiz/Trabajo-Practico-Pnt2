import { defineStore } from 'pinia'
import {
  ADMINISTRADORES_HARDCODEADOS,
  NOMBRES_ROLES,
  ROLES
} from '../data/roles'

const API_USUARIOS = 'https://6a2b1b9ab687a7d5cbc4de36.mockapi.io/prode/Usuarios'

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizarUsuario(usuario) {
  if (!usuario) return null

  return {
    ...usuario,
    rol: usuario.rol || ROLES.USUARIO
  }
}

function obtenerUsuarioGuardado() {
  const usuarioGuardado = localStorage.getItem('prode_user')

  if (!usuarioGuardado) return null

  try {
    return normalizarUsuario(JSON.parse(usuarioGuardado))
  } catch {
    localStorage.removeItem('prode_user')
    return null
  }
}

function buscarAdminHardcodeado(email) {
  const emailNormalizado = normalizarEmail(email)

  return ADMINISTRADORES_HARDCODEADOS.find(
    (admin) => normalizarEmail(admin.email) === emailNormalizado
  )
}

function guardarSesion(store, usuario) {
  const usuarioNormalizado = normalizarUsuario(usuario)

  store.user = usuarioNormalizado
  localStorage.setItem('prode_user', JSON.stringify(usuarioNormalizado))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Intentamos levantar el usuario de localStorage por si recargan la pagina.
    user: obtenerUsuarioGuardado(),
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.rol === ROLES.ADMIN,
    isUsuario: (state) => state.user?.rol === ROLES.USUARIO,
    nombreRol: (state) => NOMBRES_ROLES[state.user?.rol] || NOMBRES_ROLES[ROLES.USUARIO]
  },

  actions: {
    // Accion de Login.
    async login(email, password) {
      this.loading = true
      this.error = null

      try {
        const adminHardcodeado = buscarAdminHardcodeado(email)

        if (adminHardcodeado) {
          if (adminHardcodeado.password !== password) {
            throw new Error('Contrasenia incorrecta.')
          }

          guardarSesion(this, adminHardcodeado)
          return true
        }

        const response = await fetch(`${API_USUARIOS}?email=${encodeURIComponent(email)}`)
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor de usuarios.')
        }

        const data = await response.json()
        const users = Array.isArray(data) ? data : [data]
        const usuarioBuscado = users.find(
          (usuario) => normalizarEmail(usuario.email) === normalizarEmail(email)
        )

        if (!usuarioBuscado) {
          throw new Error('El usuario no existe.')
        }

        if (usuarioBuscado.password !== password) {
          throw new Error('Contrasenia incorrecta.')
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

    // Accion de Registro: todo usuario creado desde la app queda como usuario normal.
    async register(nombre, email, password) {
      this.loading = true
      this.error = null

      try {
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

    // Accion de Logout.
    logout() {
      this.user = null
      localStorage.removeItem('prode_user')
    },

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
