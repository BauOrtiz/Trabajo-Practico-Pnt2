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

/**
 * Helper: Crea la estructura inicial de strings vacíos para registrar
 * fallas específicas de conexión de cada API independiente.
 * @returns {Object} Diccionario de claves de errores vacío.
 */
function crearErroresVacios() {
  return {
    partidos: '',
    estadios: '',
    selecciones: ''
  }
}

/**
 * Helper: Verifica si el store cuenta con la totalidad de los datos requeridos
 * para el correcto funcionamiento de toda la aplicación.
 * @param {Object} store - Instancia actual del store 'this'.
 * @returns {boolean} True si se cargaron los 3 arrays principales de datos.
 */
function tieneDatosCompletos(store) {
  return store.partidos.length > 0 && store.estadios.length > 0 && store.selecciones.length > 0
}

// --- 🍍 STORE DE DATOS ESTÁTICOS ---
export const useEstaticoStore = defineStore('estatico', {
  state: () => ({
    partidos: [],                     // Fixture activo de partidos (puede alternar entre grupos y eliminatorias)
    partidosFaseGrupos: [],           // Caché en memoria exclusiva de los partidos de la fase de grupos
    partidosEliminatorias: [],        // Caché en memoria exclusiva de los partidos de playoffs / eliminatorias
    gruposFinalizadosPorAdmin: faseGruposFinalizadaPorAdmin(), // Estado booleano persistido de grupos terminados
    estadios: [],                     // Listado de sedes del Mundial
    selecciones: [],                  // Listado de selecciones y sus planteles
    cargado: false,                   // Flag para saber si la app ya completó la carga inicial global de datos
    loading: false,                   // Spinner para peticiones concurrentes (cargarDatosMundial)
    error: '',                        // Contenedor del primer error general de carga que aparezca
    errores: crearErroresVacios(),    // Registro estructurado de errores por endpoint
    fechaAdmin: new Date()            // ⏰ Reloj de la "Máquina del Tiempo" (por defecto, la hora actual del sistema)
  }),

  getters: {
    // Retorna true si hay algún mensaje de error general guardado en el estado
    tieneError: (state) => Boolean(state.error),
    // Getters auxiliares rápidos para saber de forma booleana dónde falló la API
    huboErrorEnPartidos: (state) => Boolean(state.errores.partidos),
    huboErrorEnEstadios: (state) => Boolean(state.errores.estadios),
    huboErrorEnSelecciones: (state) => Boolean(state.errores.selecciones),
    
    // faseGruposFinalizada: Valida de manera estricta si cada uno de los partidos 
    // de la fase de grupos está efectivamente en estado 'finalizado'.
      faseGruposFinalizada: (state) => (
      state.partidosFaseGrupos.length > 0 &&
      state.partidosFaseGrupos.every(
        (partido) => partido.estado === 'finalizado'
      )
    ),

    /**
     * 🔮 EL MOTOR DE SIMULACIÓN TEMPORAL (MÁQUINA DEL TIEMPO):
     * Este getter toma los partidos almacenados y recalcula reactivamente su estado y sus goles
     * en base al reloj de simulación (`fechaAdmin`) arrastrado por el administrador.
     * 
     * Reglas de negocio automatizadas:
     * - Si la diferencia entre el "reloj de simulación" y el partido supera los 90 minutos: Finalizado.
     * - Si la diferencia es positiva pero menor a 90 minutos: En Curso.
     * - Si la diferencia es negativa: Programado (no empezó).
     * 
     * Adicionalmente, maneja los goles de forma consistente:
     * - Si el partido está programado o en curso, oculta los goles de la API para que nadie los vea antes de tiempo.
     * - Si finalizó y la API trae goles reales, los respeta.
     * - Si finalizó pero no hay goles cargados en la API, simula resultados deterministas usando el índice del bucle.
     */
    partidosConEstadoCalculado: (state) => {
      if (!state.partidos) return []
      
      return state.partidos.map((partido, index) => {
        const fechaPartido = new Date(partido.fecha)
        const limiteAdmin = new Date(state.fechaAdmin)
        
        // Calculamos la diferencia temporal en milisegundos
        const diferencia = limiteAdmin - fechaPartido
        const noventaMinutos = 90 * 60 * 1000 // Duración estándar de un partido en milisegundos
        
        let estadoCalculado = 'programado'
        
        if (diferencia > noventaMinutos) {
          estadoCalculado = 'finalizado'
        } else if (diferencia >= 0) {
          estadoCalculado = 'en curso'
        }

        // ⚽ CONTROL DEL TIEMPO PARA GOLES:
        let golesLocalCalculados = null
        let golesVisitanteCalculados = null

        if (estadoCalculado === 'finalizado') {
          // Si el partido ya terminó según el Admin, le asignamos goles de forma segura:
          if (partido.golesLocal !== null && partido.golesLocal !== undefined) {
            // Si la API ya traía goles reales cargados, los respetamos
            golesLocalCalculados = partido.golesLocal
            golesVisitanteCalculados = partido.golesVisitante
          } else {
            // Si la API no traía goles, generamos resultados simulados de forma matemática y fija (determinista)
            // utilizando la posición (index) del partido dentro de la lista para simular resultados realistas
            golesLocalCalculados = (index % 3)
            golesVisitanteCalculados = ((index + 1) % 3)
          }
        } else {
          // 🛡️ SEGURIDAD: Si está "programado" o "en curso", borramos de la vista
          // cualquier gol que venga por error o anticipación desde la API.
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
    /**
     * Acción: Actualiza de forma reactiva el reloj virtual del administrador.
     * @param {string|Date} nuevaFecha - Nueva fecha virtual configurada en la UI.
     */
    actualizarFechaAdmin(nuevaFecha) {
      this.fechaAdmin = new Date(nuevaFecha)
    },

    /**
     * Acción: Reinicia a un estado vacío todos los mensajes de error guardados en memoria.
     */
    limpiarErrores() {
      this.error = ''
      this.errores = crearErroresVacios()
    },

    /**
     * Acción: Busca de forma lineal y devuelve un partido por su ID.
     */
    obtenerPartidoPorId(id) {
      return this.partidos.find((partido) => String(partido.id) === String(id)) || null
    },

    /**
     * Acción: Busca y devuelve un estadio por su ID.
     */
    obtenerEstadioPorId(id) {
      return this.estadios.find((estadio) => String(estadio.id) === String(id)) || null
    },

    /**
     * Acción: Busca y devuelve una selección por su ID.
     */
    obtenerSeleccionPorId(id) {
      return this.selecciones.find((seleccion) => String(seleccion.id) === String(id)) || null
    },

    /**
     * Acción: Evalúa el estado de carga y sincroniza los flags de error específicos.
     * Si un array de datos se llenó correctamente, borra su mensaje de error individual.
     */
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

      // El error general tomará el primer mensaje de error existente de los endpoints
      this.error = this.errores.partidos || this.errores.estadios || this.errores.selecciones || ''
      this.cargado = tieneDatosCompletos(this)
    },

    /**
     * Acción: Solicita y carga los partidos de la Fase de Grupos desde la API.
     * Aplica el estado forzado de grupos del Admin si corresponde.
     */
    async cargarPartidos() {
      if (this.partidosFaseGrupos.length > 0) return // Evitamos sobreescribir si ya los tenemos en memoria

      this.errores.partidos = ''

      try {
        const partidos = await obtenerPartidos()
        // Eliminado 'aplicarCambiosFechaPartidos' obsoleto: cargamos directamente el fixture original
        this.partidosFaseGrupos = aplicarEstadoFaseGrupos(partidos)
        this.partidos = this.partidosFaseGrupos
      } catch {
        this.errores.partidos = 'No se pudieron cargar los partidos de fase de grupos.'
        return
      }

      // Si las condiciones indican que la fase de grupos ya se encuentra finalizada por simulación del Admin,
      // cargamos automáticamente la fase siguiente (eliminatorias) para no trabar el flujo.
      if (this.faseGruposFinalizada) {
        try {
          await this.cargarPartidosEliminatorias()
        } catch {
          // Si falla la segunda API, conservamos los grupos para no dejar la app vacía
          this.partidos = this.partidosFaseGrupos
        }
      }
    },

    /**
     * Acción: Solicita de forma asíncrona la fase de Playoffs / Eliminatorias de la API.
     */
    async cargarPartidosEliminatorias() {
      if (this.partidosEliminatorias.length === 0) {
        const partidos = await obtenerPartidosEliminatorias()
        // Eliminado 'aplicarCambiosFechaPartidos' obsoleto de eliminatorias
        this.partidosEliminatorias = partidos
      }

      this.partidos = this.partidosEliminatorias
    },

    /**
     * Acción: Fuerza administrativamente la conclusión de la fase de grupos.
     * Verifica preventivamente que la fase eliminatoria sea cargable antes de persistir los cambios.
     */
    async finalizarPartidosFaseGrupos() {
      // Primero comprobamos que la fase siguiente se pueda cargar. Solo entonces
      // persistimos el cambio para no dejar la aplicación en un estado roto.
      await this.cargarPartidosEliminatorias()
      guardarFaseGruposFinalizada()
      this.gruposFinalizadosPorAdmin = true
      this.partidosFaseGrupos = aplicarEstadoFaseGrupos(this.partidosFaseGrupos)
    },

    /**
     * Acción: Restablece de golpe la fase de grupos.
     * Remueve la persistencia del LocalStorage y devuelve los partidos a sus valores originales de la API.
     */
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

    /**
     * Acción: Solicita el listado de Estadios desde Mockachino y los asigna al estado.
     */
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

    /**
     * Acción: Solicita el listado de Selecciones desde la API y las asigna al estado.
     */
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

    /**
     * Acción: El punto de entrada principal para levantar toda la información del Mundial.
     * Ejecuta las 3 peticiones en paralelo (`Promise.all`) de forma asíncrona para mejorar la velocidad.
     */
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