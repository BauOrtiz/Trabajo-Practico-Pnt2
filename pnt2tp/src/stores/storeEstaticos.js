import { defineStore } from 'pinia'
import { obtenerEstadios, obtenerPartidos, obtenerSelecciones } from '@/services/partidosService'

function crearErroresVacios() {
  return {
    partidos: '',
    estadios: '',
    selecciones: ''
  }
}

function tieneDatosCompletos(store) {
  return store.partidos.length > 0 && store.estadios.length > 0 && store.selecciones.length > 0
}

export const useEstaticoStore = defineStore('estatico', {
  state: () => ({
    partidos: [],
    estadios: [],
    selecciones: [],
    cargado: false,
    loading: false,
    error: '',
    errores: crearErroresVacios()
  }),

  getters: {
    tieneError: (state) => Boolean(state.error),
    huboErrorEnPartidos: (state) => Boolean(state.errores.partidos),
    huboErrorEnEstadios: (state) => Boolean(state.errores.estadios),
    huboErrorEnSelecciones: (state) => Boolean(state.errores.selecciones)
  },

  actions: {
    limpiarErrores() {
      this.error = ''
      this.errores = crearErroresVacios()
    },

    obtenerPartidoPorId(id) {
      return this.partidos.find((partido) => String(partido.id) === String(id)) || null
    },

    obtenerEstadioPorId(id) {
      return this.estadios.find((estadio) => String(estadio.id) === String(id)) || null
    },

    obtenerSeleccionPorId(id) {
      return this.selecciones.find((seleccion) => String(seleccion.id) === String(id)) || null
    },

    actualizarEstadoCarga() {
      if (this.partidos.length > 0) {
        this.errores.partidos = ''
      }

      if (this.estadios.length > 0) {
        this.errores.estadios = ''
      }

      if (this.selecciones.length > 0) {
        this.errores.selecciones = ''
      }

      this.error = this.errores.partidos || this.errores.estadios || this.errores.selecciones || ''
      this.cargado = tieneDatosCompletos(this)
    },

    async cargarPartidos() {
      if (this.partidos.length > 0) return

      this.errores.partidos = ''

      try {
        this.partidos = await obtenerPartidos()
      } catch {
        this.errores.partidos = 'No se pudieron cargar los partidos.'
      }
    },

    async cargarEstadios() {
      if (this.estadios.length > 0) return

      this.errores.estadios = ''

      try {
        const respuesta = await obtenerEstadios()
        this.estadios = respuesta.estadios || []
      } catch {
        this.errores.estadios = 'No se pudieron cargar los estadios.'
      }
    },

    async cargarSelecciones() {
      if (this.selecciones.length > 0) return

      this.errores.selecciones = ''

      try {
        const respuesta = await obtenerSelecciones()
        this.selecciones = respuesta.selecciones || []
      } catch {
        this.errores.selecciones = 'No se pudieron cargar las selecciones.'
      }
    },

    async cargarDatosMundial() {
      if (this.loading) {
        return this
      }

      if (tieneDatosCompletos(this)) {
        this.cargado = true
        return this
      }

      this.loading = true

      try {
        await this.cargarPartidos()
        await this.cargarEstadios()
        await this.cargarSelecciones()
        this.actualizarEstadoCarga()
        return this
      } finally {
        this.loading = false
      }
    }
  }
})
