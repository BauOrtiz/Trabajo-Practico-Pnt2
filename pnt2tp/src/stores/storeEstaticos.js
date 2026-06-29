import { obtenerEstadios, obtenerSelecciones,obtenerPartidos } from '@/services/partidosService'
import { defineStore } from 'pinia'

// URLs de tus endpoints en Mockachino (reemplazá con tus IDs reales)
const BASE_URL = 'https://www.mockachino.com/tu-id-de-proyecto'

export const useEstaticoStore = defineStore('estatico', {
  state: () => ({
    partidos: [],
    estadios: [],
    selecciones: [],
    cargado: false, // Flag para saber si ya tenemos los datos en memoria
    loading: false,
    error: null
  }),

  actions: {
    async cargarDatosMundial() {
      // 1. CONTROL DE SEGURIDAD: Si ya se cargaron una vez, no hace nada (evita re-peticiones)
      if (this.cargado) return

      this.loading = true
      this.error = null

      try {
        // 2. Ejecutamos los 3 fetches EN PARALELO con Promise.all (es mucho más rápido)
         const resPartidos= await obtenerPartidos()
         const resEstadios= await obtenerEstadios()
         const resSelecciones= await obtenerSelecciones()
        




        // 4. Parseamos los JSONs 
        this.partidos = resPartidos             // ✅ DIRECTO: Ya es el array mapeado =  resPartidos.partidos
        this.estadios =  resEstadios.estadios
        this.selecciones =  resSelecciones.selecciones

        // 5. Marcamos que la app ya tiene todo listo
        this.cargado = true

      } catch (err) {
        this.error = err.message
        console.error("Error cargando el Mundial:", err)
      } finally {
        this.loading = false
      }
    }
  }
})