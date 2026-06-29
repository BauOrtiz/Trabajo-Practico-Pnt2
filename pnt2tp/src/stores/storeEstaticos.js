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

function crearCarga(nombre, promesa) {
  return {
    nombre,
    promesa
  }
}

function obtenerCargasPendientes(store, force) {
  const cargas = []

  if (force || store.partidos.length === 0) {
    store.errores.partidos = ''
    cargas.push(crearCarga('partidos', obtenerPartidos()))
  }

  if (force || store.estadios.length === 0) {
    store.errores.estadios = ''
    cargas.push(crearCarga('estadios', obtenerEstadios()))
  }

  if (force || store.selecciones.length === 0) {
    store.errores.selecciones = ''
    cargas.push(crearCarga('selecciones', obtenerSelecciones()))
  }

  return cargas
}

function guardarResultado(store, nombre, valor) {
  if (nombre === 'partidos') {
    store.partidos = valor
  }

  if (nombre === 'estadios') {
    store.estadios = valor?.estadios ?? []
  }

  if (nombre === 'selecciones') {
    store.selecciones = valor?.selecciones ?? []
  }
}

function guardarError(store, nombre) {
  if (nombre === 'partidos') {
    store.errores.partidos = 'No se pudieron cargar los partidos.'
  }

  if (nombre === 'estadios') {
    store.errores.estadios = 'No se pudieron cargar los estadios.'
  }

  if (nombre === 'selecciones') {
    store.errores.selecciones = 'No se pudieron cargar las selecciones.'
  }
}

function limpiarErroresDeDatosCargados(store) {
  if (store.partidos.length > 0) {
    store.errores.partidos = ''
  }

  if (store.estadios.length > 0) {
    store.errores.estadios = ''
  }

  if (store.selecciones.length > 0) {
    store.errores.selecciones = ''
  }
}

function sincronizarEstadoDeCarga(store) {
  limpiarErroresDeDatosCargados(store)

  const erroresActivos = Object.values(store.errores).filter(Boolean)
  store.error = erroresActivos[0] || ''
  store.cargado = tieneDatosCompletos(store)
}

export const useEstaticoStore = defineStore('estatico', {
  state: () => ({
    partidos: [],
    estadios: [],
    selecciones: [],
    cargado: false,
    loading: false,
    error: '',
    errores: crearErroresVacios(),
    cargaPromise: null
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
      return this.partidos.find((partido) => String(partido.id) === String(id)) ?? null
    },

    obtenerEstadioPorId(id) {
      return this.estadios.find((estadio) => String(estadio.id) === String(id)) ?? null
    },

    obtenerSeleccionPorId(id) {
      return this.selecciones.find((seleccion) => String(seleccion.id) === String(id)) ?? null
    },

    async cargarDatosMundial(force = false) {
      if (this.loading && this.cargaPromise) {
        return this.cargaPromise
      }

      if (tieneDatosCompletos(this) && !force) {
        this.cargado = true
        return this
      }

      this.loading = true

      this.cargaPromise = (async () => {
        const cargas = obtenerCargasPendientes(this, force)

        const resultados = await Promise.allSettled(cargas.map((carga) => carga.promesa))

        resultados.forEach((resultado, index) => {
          const nombre = cargas[index].nombre

          if (resultado.status === 'fulfilled') {
            guardarResultado(this, nombre, resultado.value)
            return
          }

          guardarError(this, nombre)
        })

        sincronizarEstadoDeCarga(this)

        return this
      })()

      try {
        return await this.cargaPromise
      } finally {
        this.loading = false
        this.cargaPromise = null
      }
    }
  }
})
