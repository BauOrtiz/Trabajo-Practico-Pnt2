import { defineStore } from "pinia";

const API_USUARIOS='https://6a2b1b9ab687a7d5cbc4de36.mockapi.io/prode/Usuarios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Intentamos levantar el usuario de localStorage por si recargan la página
    user: JSON.parse(localStorage.getItem('prode_user')) || null,
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user
  },

  actions: {
    // Acción de Login
    async login(email, password) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`${API_USUARIOS}?email=${email}`)
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor de usuarios.')
        }

        const data = await response.json()

        const users = Array.isArray(data) ? data : [data]
        const usuarioBuscado = users.find((u) => u.email === email)

        if (!usuarioBuscado) {
          throw new Error('El usuario no existe.')
        }

        if (usuarioBuscado.password !== password) {
          throw new Error('Contraseña incorrecta.')
        }

        this.user = usuarioBuscado
        localStorage.setItem('prode_user', JSON.stringify(usuarioBuscado))
        
        return true
      } catch (err) {
        this.error = err.message || 'Error en el servidor.'
        return false
      } finally {
        this.loading = false
      }
    },

    // Acción de Registro (por si quieren que el profe vea cómo se crean usuarios nuevos)
    async register(nombre, email, password) {
      this.loading = true
      this.error = null
      try {
        const nuevoUsuario = {
          nombre: nombre,
          email: email,
          password: password,
          puntosTotales: 0
        }
        
        const response = await fetch(API_USUARIOS,{
            method:'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoUsuario)
        })
        if (!response.ok) {
          throw new Error('No se pudo registrar el usuario.')
        }
        const datoGuardado = await response.json()
        
        this.user = datoGuardado
        localStorage.setItem('prode_user', JSON.stringify(datoGuardado))
        return true
      } catch (err) {
        this.error = err.message || 'No se pudo registrar el usuario.'
        return false
      } finally {
        this.loading = false
      }
    },

    // Acción de Logout
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
