import { defineStore } from 'pinia'
import {
  obtenerEstadios,
  obtenerPartidos,
  obtenerPartidosEliminatorias,
  obtenerSelecciones
} from '@/services/partidosService'
import {
  aplicarEstadoFaseGrupos,
  eliminarFaseGruposFinalizada,
  faseGruposFinalizadaPorAdmin,
  guardarFaseGruposFinalizada
} from '@/services/calendarioAdminService'



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
    partidosFaseGrupos: [],           
    partidosEliminatorias: [],        
    gruposFinalizadosPorAdmin: faseGruposFinalizadaPorAdmin(), 
    estadios: [],                     
    selecciones: [],                  
    cargado: false,                   
    loading: false,                   
    error: '',                        
    errores: crearErroresVacios(),    
    fechaAdmin: new Date()            
  }),

  getters: {

    tieneError: (state) => Boolean(state.error),

    huboErrorEnPartidos: (state) => Boolean(state.errores.partidos),
    huboErrorEnEstadios: (state) => Boolean(state.errores.estadios),
    huboErrorEnSelecciones: (state) => Boolean(state.errores.selecciones),


      faseGruposFinalizada: (state) => (
      state.partidosFaseGrupos.length > 0 &&
      state.partidosFaseGrupos.every(
        (partido) => partido.estado === 'finalizado'
      )
    ),



    partidosConEstadoCalculado: (state) => {
      if (!state.partidos) return []

      return state.partidos.map((partido, index) => {
        const fechaPartido = new Date(partido.fecha)
        const limiteAdmin = new Date(state.fechaAdmin)


        const diferencia = limiteAdmin - fechaPartido
        const noventaMinutos = 90 * 60 * 1000 

        let estadoCalculado = 'programado'

        if (diferencia > noventaMinutos) {
          estadoCalculado = 'finalizado'
        } else if (diferencia >= 0) {
          estadoCalculado = 'en curso'
        }


        let golesLocalCalculados = null
        let golesVisitanteCalculados = null

        if (estadoCalculado === 'finalizado') {

          if (partido.golesLocal !== null && partido.golesLocal !== undefined) {

            golesLocalCalculados = partido.golesLocal
            golesVisitanteCalculados = partido.golesVisitante
          } else {

            golesLocalCalculados = (index % 3)
            golesVisitanteCalculados = ((index + 1) % 3)
          }
        } else {

          golesLocalCalculados = null
          golesVisitanteCalculados = null
        }

        return {
          ...partido,
          estado: estadoCalculado,
          golesLocal: golesLocalCalculados,
          golesVisitante: golesVisitanteCalculados
        }
      })
    }
  },

  actions: {


    actualizarFechaAdmin(nuevaFecha) {
      this.fechaAdmin = new Date(nuevaFecha)
    },



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
      if (this.partidosFaseGrupos.length > 0) return 

      this.errores.partidos = ''

      try {
        const partidos = await obtenerPartidos()

        this.partidosFaseGrupos = aplicarEstadoFaseGrupos(partidos)
        this.partidos = this.partidosFaseGrupos
      } catch {
        this.errores.partidos = 'No se pudieron cargar los partidos de fase de grupos.'
        return
      }


      if (this.faseGruposFinalizada) {
        try {
          await this.cargarPartidosEliminatorias()
        } catch {

          this.partidos = this.partidosFaseGrupos
        }
      }
    },



    async cargarPartidosEliminatorias() {
      if (this.partidosEliminatorias.length === 0) {
        const partidos = await obtenerPartidosEliminatorias()

        this.partidosEliminatorias = partidos
      }

      this.partidos = this.partidosEliminatorias
    },



    async finalizarPartidosFaseGrupos() {

      await this.cargarPartidosEliminatorias()
      guardarFaseGruposFinalizada()
      this.gruposFinalizadosPorAdmin = true
      this.partidosFaseGrupos = aplicarEstadoFaseGrupos(this.partidosFaseGrupos)
    },



    restablecerFaseGrupos() {
      eliminarFaseGruposFinalizada()
      this.gruposFinalizadosPorAdmin = false

      this.partidosFaseGrupos = this.partidosFaseGrupos.map((partido) => ({
        ...partido,
        estado: partido.partidoOriginal?.estado?.toLowerCase() || 'programado',
        finalizadoPorAdmin: false
      }))

      this.partidos = this.partidosFaseGrupos
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
        await Promise.all([
          this.cargarPartidos(),
          this.cargarEstadios(),
          this.cargarSelecciones()
        ])

        this.actualizarEstadoCarga()
        return this
      } finally {
        this.loading = false
      }
    }
  }
})