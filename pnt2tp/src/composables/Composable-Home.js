import { computed } from 'vue'
import { useEstaticoStore } from '../stores/storeEstaticos'

export function useProximosPartidos() {
  const estaticoStore = useEstaticoStore()

  // 1. CARGANDO Y ERROR: Atados al store de Pinia de manera reactiva
  const cargando = computed(() => estaticoStore.loading && estaticoStore.partidos.length === 0)
  const error = computed(() => estaticoStore.error || '')

  // 2. PRÓXIMOS PARTIDOS: Filtramos según la máquina del tiempo del Admin
  const proximosPartidos = computed(() => {
    // Usamos el listado que ya calcula el estado temporal según la fecha del admin
    const partidosCalculados = estaticoStore.partidosConEstadoCalculado || []
    
    // Obtenemos la fecha virtual configurada por el administrador en Pinia
    const fechaReferencia = new Date(estaticoStore.fechaAdmin)

    // Definimos el rango: partidos desde "hoy virtual" hasta los próximos 7 días virtuales
    const limiteSemana = new Date(fechaReferencia.getTime() + 7 * 24 * 60 * 60 * 1000)

    return partidosCalculados.filter((partido) => {
      const fechaPartido = new Date(partido.fecha)
      // Mostramos los partidos que ocurren en esta ventana temporal simulada
      return fechaPartido >= fechaReferencia && fechaPartido <= limiteSemana
    })
  })

  // 3. AGRUPAMIENTO POR DÍA: Divide los partidos filtrados en un objeto para el v-for
  const partidosPorDia = computed(() => {
    const agrupados = {}

    proximosPartidos.value.forEach((partido) => {
      const fecha = new Date(partido.fecha)
      // Formateamos el encabezado de cada día (ej: "lunes, 15 de junio")
      const diaFormateado = fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

      // Ponemos la primera letra en mayúscula para que quede prolijo
      const diaCapitalizado = diaFormateado.charAt(0).toUpperCase() + diaFormateado.slice(1)

      if (!agrupados[diaCapitalizado]) {
        agrupados[diaCapitalizado] = []
      }
      agrupados[diaCapitalizado].push(partido)
    })

    return agrupados
  })

  // 4. FORMATEADOR DE HORARIOS: Extrae la hora limpia para cada tarjeta
  function formatearHora(fechaStr) {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
    cargando,
    error,
    proximosPartidos,
    partidosPorDia,
    formatearHora
  }
}